import re
import pdfplumber
from pathlib import Path


def extract_text_from_pdf(file_path: str) -> str:
    """Extract all text from a PDF file"""
    full_text = ""
    path = Path(file_path)

    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {file_path}")

    if not path.suffix.lower() == ".pdf":
        raise ValueError("File is not a PDF")

    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

    if not full_text.strip():
        raise ValueError("No text could be extracted from the PDF. It may be a scanned document.")

    return clean_text(full_text)


def clean_text(text: str) -> str:
    """Clean extracted text — remove watermarks, URLs, noise, normalize whitespace"""

    lines = text.split("\n")
    cleaned_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if _is_noise_line(stripped):
            continue
        cleaned_lines.append(stripped)

    text = "\n".join(cleaned_lines)

    # Remove URLs
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'www\.\S+', '', text)

    # Remove email addresses
    text = re.sub(r'\S+@\S+\.\S+', '', text)

    # Remove phone numbers
    text = re.sub(r'[\+]?\d{1,3}[\s\-]?\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}', '', text)

    # Remove whatsapp mentions
    text = re.sub(r'(?i)whatsapp\s*:\s*', '', text)

    # Remove Page X of Y
    text = re.sub(r'(?i)page\s+\d+\s+of\s+\d+', '', text)

    # Remove brand watermarks
    text = re.sub(r'(?i)mega\s*lecture', '', text)
    text = re.sub(r'(?i)megalecture', '', text)
    text = re.sub(r'(?i)refined\s+by\s+\w+', '', text)

    # Clean excessive whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'^\s+$', '', text, flags=re.MULTILINE)

    return text.strip()


def _is_noise_line(line: str) -> bool:
    """Check if a line is noise"""
    lower = line.lower().strip()

    noise_patterns = [
        'whatsapp:', 'whatsapp :', 'megalecture', 'mega lecture',
        'email:', 'www.youtube', 'www.megalecture', 'youtube.com',
    ]

    for pattern in noise_patterns:
        if pattern in lower:
            return True

    if line.startswith('http') or line.startswith('www.'):
        return True

    if re.match(r'^Page\s+\d+\s+of\s+\d+$', line, re.IGNORECASE):
        return True

    if re.match(r'^\d{1,3}$', line.strip()):
        return True

    return False


def chunk_text(text: str, chunk_size: int = 400, overlap: int = 80) -> list:
    """Split text into overlapping chunks"""
    words = text.split()

    if len(words) <= chunk_size:
        return [text]

    chunks = []
    step = chunk_size - overlap
    for i in range(0, len(words), step):
        chunk = " ".join(words[i:i + chunk_size])
        if len(chunk.strip()) > 50:
            chunks.append(chunk.strip())

    return chunks


def get_document_info(file_path: str) -> dict:
    """Get basic info about a PDF"""
    with pdfplumber.open(file_path) as pdf:
        total_pages = len(pdf.pages)
        total_chars = 0
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                total_chars += len(text)

    return {
        "pages": total_pages,
        "characters": total_chars,
        "estimated_words": total_chars // 5,
    }