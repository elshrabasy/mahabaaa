/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { mapco: {50:'#eef9f8',100:'#d4f1ee',500:'#0f766e',600:'#0b635d',700:'#0a4f4a',800:'#083f3b',900:'#062f2d',orange:'#f97316'}},
    boxShadow: { soft:'0 10px 30px rgba(2, 6, 23, 0.08)' },
    animation: {'fade-in':'fadeIn 0.25s ease-out','slide-up':'slideUp 0.25s ease-out'},
    keyframes: { fadeIn:{'0%':{opacity:0},'100%':{opacity:1}}, slideUp:{'0%':{opacity:0,transform:'translateY(8px)'},'100%':{opacity:1,transform:'translateY(0)'}}}
  } },
  plugins:[]
};