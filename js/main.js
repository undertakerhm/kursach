const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');

canvas.width  = canvas.parentElement.clientWidth  - 40;
canvas.height = canvas.parentElement.clientHeight - 40;

ctx.fillStyle = '#ffffff';
ctx.fillRect(0, 0, canvas.width, canvas.height);

let isDrawing = false;
let color = '#000000';
let tool = 'pencil';
let lastX = null, lastY = null;

document.querySelectorAll('.tool-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    tool = btn.dataset.tool;
  });
});

document.getElementById('colorPicker').addEventListener('input', e => {
  color = e.target.value;
});

document.getElementById('clearBtn').addEventListener('click', () => {
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

canvas.addEventListener('mousedown', e => {
  isDrawing = true;
  const r = canvas.getBoundingClientRect();
  lastX = e.clientX - r.left;
  lastY = e.clientY - r.top;
});

canvas.addEventListener('mousemove', e => {
  if (!isDrawing) return;
  const r = canvas.getBoundingClientRect();
  const x = e.clientX - r.left;
  const y = e.clientY - r.top;
  ctx.beginPath();
  ctx.moveTo(lastX, lastY);
  ctx.lineTo(x, y);
  ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
  ctx.lineWidth = tool === 'eraser' ? 16 : 4;
  ctx.lineCap = 'round';
  ctx.stroke();
  lastX = x;
  lastY = y;
});

canvas.addEventListener('mouseup', () => { isDrawing = false; lastX = null; lastY = null; });
canvas.addEventListener('mouseleave', () => { isDrawing = false; lastX = null; lastY = null; });
