import io
import re
from typing import Tuple
import pandas as pd
from fastapi import UploadFile
from app.core.config import settings
from app.core.errors import FileValidationError

def validate_csv_file(file: UploadFile, content: bytes) -> Tuple[bool, str]:
    """
    Validates CSV file size, extension, encoding, and parseability.
    """
    filename = file.filename or "upload.csv"
    ext = "." + filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise FileValidationError(f"Invalid file extension '{ext}'. Only CSV (.csv) files are supported.")

    if len(content) == 0:
        raise FileValidationError("Uploaded CSV file is completely empty (0 bytes).")

    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise FileValidationError(
            f"File exceeds maximum allowed upload size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)} MB."
        )

    # Check text encoding & readability
    encodings = ["utf-8", "utf-8-sig", "latin1", "cp1252"]
    decoded_df = None
    last_error = ""

    for enc in encodings:
        try:
            stream = io.BytesIO(content)
            # Try parsing with pandas
            decoded_df = pd.read_csv(stream, encoding=enc, nrows=10)
            if decoded_df is not None:
                return True, enc
        except Exception as e:
            last_error = str(e)
            continue

    raise FileValidationError(f"Failed to parse CSV file. Ensure it is valid CSV format. Details: {last_error}")

def sanitize_column_name(name: str) -> str:
    """Sanitize column name to remove dangerous characters or excessive whitespace."""
    cleaned = str(name).strip()
    return cleaned if cleaned else "Unnamed_Column"
