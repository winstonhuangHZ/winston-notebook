"""Regenerate the public sample PDF. Requires Python's reportlab package."""
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

output = Path(__file__).resolve().parent.parent / 'public/files/example-note.pdf'
output.parent.mkdir(parents=True, exist_ok=True)
w, h = A4
paper = colors.HexColor('#f8f7f0')
ink = colors.HexColor('#253b32')
muted = colors.HexColor('#6f8074')
green = colors.HexColor('#d5e7b2')
c = canvas.Canvas(str(output), pagesize=A4, pageCompression=1)
c.setTitle('A page for ideas - Example PDF')
c.setAuthor("Winston's Notebook")
c.setFillColor(paper); c.rect(0, 0, w, h, fill=1, stroke=0)
c.setFillColor(ink); c.rect(54, h-91, 38, 38, fill=1, stroke=0)
c.setFillColor(paper); c.setFont('Times-Bold', 23); c.drawString(61, h-80, 'W.')
c.setFillColor(ink); c.setFont('Helvetica-Bold', 8); c.drawString(104, h-68, "WINSTON'S NOTEBOOK")
c.setFillColor(muted); c.setFont('Helvetica', 8); c.drawRightString(w-54, h-68, 'SAMPLE DOCUMENT / 01')
c.setStrokeColor(colors.HexColor('#d9dfd2')); c.line(54, h-111, w-54, h-111)
c.setFillColor(muted); c.setFont('Helvetica-Bold', 8); c.drawString(54, h-166, 'A SMALL SPACE FOR BIG IDEAS')
c.setFillColor(ink); c.setFont('Times-Roman', 43); c.drawString(51, h-222, 'A page for ideas.')
c.setFillColor(muted); c.setFont('Helvetica', 11); c.drawString(54, h-252, 'An example PDF for your notebook. Replace it with your own work.')
c.setFillColor(green); c.rect(54, h-319, w-108, 39, fill=1, stroke=0)
c.setFillColor(ink); c.setFont('Helvetica-Bold', 9); c.drawString(70, h-304, 'NOTICE  /  COLLECT  /  SHARE')
rows = [
 ('01', 'Start with a question', 'Write down something that caught your attention.'),
 ('02', 'Follow the idea', 'Add notes, sketches, sources, or your own observations.'),
 ('03', 'Keep it somewhere', 'Attach a PDF to a post when it is ready to share.'),
]
y = h-372
for number, title, body in rows:
    c.setFillColor(muted); c.setFont('Helvetica-Bold', 9); c.drawString(54, y, number)
    c.setFillColor(ink); c.setFont('Times-Bold', 17); c.drawString(95, y-1, title)
    c.setFillColor(muted); c.setFont('Helvetica', 10); c.drawString(95, y-21, body)
    c.setStrokeColor(colors.HexColor('#d9dfd2')); c.line(54, y-40, w-54, y-40)
    y -= 86
c.setFillColor(muted); c.setFont('Helvetica', 8); c.drawString(54, 49, 'EXAMPLE FILE - SAFE TO REPLACE OR DELETE')
c.drawRightString(w-54, 49, 'KEEP WONDERING  /  W.')
c.save()
print(output)
