#!/usr/bin/env python3
"""Set or show the lifecycle rule of an S3 bucket (AWS Signature V4).

Uses only the Python standard library so it runs on a fresh Ubuntu VM.
Credentials come from the environment: BACKUP_S3_ACCESS_KEY,
BACKUP_S3_SECRET_KEY (and optionally S3_ENDPOINT, S3_REGION).

  s3-lifecycle.py put <bucket> <days>   # expire every object after <days>
  s3-lifecycle.py get <bucket>
"""
import base64
import datetime
import hashlib
import hmac
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

ENDPOINT = os.environ.get("S3_ENDPOINT", "http://127.0.0.1:3900")
REGION = os.environ.get("S3_REGION", "garage")
ACCESS_KEY = os.environ["BACKUP_S3_ACCESS_KEY"]
SECRET_KEY = os.environ["BACKUP_S3_SECRET_KEY"]


def _sign(key: bytes, msg: str) -> bytes:
    return hmac.new(key, msg.encode(), hashlib.sha256).digest()


def request(method: str, bucket: str, query: str, body: bytes = b"", extra_headers=None) -> str:
    url = urllib.parse.urlsplit(ENDPOINT)
    now = datetime.datetime.now(datetime.timezone.utc)
    amz_date = now.strftime("%Y%m%dT%H%M%SZ")
    date = now.strftime("%Y%m%d")
    payload_hash = hashlib.sha256(body).hexdigest()

    headers = {"host": url.netloc, "x-amz-content-sha256": payload_hash, "x-amz-date": amz_date}
    headers.update({k.lower(): v for k, v in (extra_headers or {}).items()})
    signed = ";".join(sorted(headers))
    canonical_headers = "".join(f"{k}:{headers[k].strip()}\n" for k in sorted(headers))
    canonical_request = "\n".join(
        [method, f"/{bucket}", f"{query}=", canonical_headers, signed, payload_hash]
    )

    scope = f"{date}/{REGION}/s3/aws4_request"
    string_to_sign = "\n".join(
        ["AWS4-HMAC-SHA256", amz_date, scope, hashlib.sha256(canonical_request.encode()).hexdigest()]
    )
    key = _sign(_sign(_sign(_sign(f"AWS4{SECRET_KEY}".encode(), date), REGION), "s3"), "aws4_request")
    signature = hmac.new(key, string_to_sign.encode(), hashlib.sha256).hexdigest()
    headers["authorization"] = (
        f"AWS4-HMAC-SHA256 Credential={ACCESS_KEY}/{scope}, SignedHeaders={signed}, Signature={signature}"
    )

    req = urllib.request.Request(
        f"{ENDPOINT}/{bucket}?{query}", data=body or None, method=method,
        headers={k: v for k, v in headers.items() if k != "host"},
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read().decode()
    except urllib.error.HTTPError as err:
        sys.exit(f"HTTP {err.code}: {err.read().decode()}")


def main() -> None:
    if len(sys.argv) < 3 or sys.argv[1] not in ("put", "get"):
        sys.exit(__doc__)
    action, bucket = sys.argv[1], sys.argv[2]
    if action == "put":
        days = int(sys.argv[3])
        body = (
            "<LifecycleConfiguration><Rule>"
            f"<ID>hapus-setelah-{days}-hari</ID><Status>Enabled</Status>"
            "<Filter><Prefix></Prefix></Filter>"
            f"<Expiration><Days>{days}</Days></Expiration>"
            "</Rule></LifecycleConfiguration>"
        ).encode()
        md5 = base64.b64encode(hashlib.md5(body).digest()).decode()
        request("PUT", bucket, "lifecycle", body, {"content-md5": md5, "content-type": "application/xml"})
    print(request("GET", bucket, "lifecycle"))


if __name__ == "__main__":
    main()
