const effects = {
  "Gray":        { filter: "grayscale(1)" },
  "Xray":        { filter: "grayscale(1) invert(1)" },
  "Invert":      { filter: "invert(1)" },
  "FlipH":       { filter: "none", transform: "scaleX(-1)" },
  "FlipV":       { filter: "none", transform: "scaleY(-1)" },
  "Glow":        { filter: "drop-shadow(0 0 8px #ffd54f) drop-shadow(0 0 16px #ffb300)" },
  "Shadow":      { filter: "drop-shadow(6px 6px 4px rgba(0,0,0,.7))" },
  "Bold Shadow": { filter: "drop-shadow(8px 8px 0 rgba(255,255,255,.35))" },
  "DropShadow":  { filter: "drop-shadow(0 10px 10px rgba(0,0,0,.9))" },
  "Blur":        { filter: "blur(3px)" },
  "Wave":        { filter: "url(#wave)" },
  "Mask":        { filter: "none",
                   mask: "radial-gradient(circle, #000 45%, transparent 72%)" },
  "Alpha":       { filter: "none", opacity: ".4" }
};

const pic = document.getElementById("pic");
const bar = document.getElementById("bar");

function aplly(name){
    const e = effects[name];
    pic.style.filter = e.filter || "none";
    pic.style.transform=  e.transform || "none";
    pic.style.opacity =  e.opacity || "1";
    pic.style.webkitMask = pic.style.mask = e.mask === "none";

    bar.querySelector("button").forEach(b => b.classList.toggle("active", b.textContent === name));
}

Object.keys(effects).forEach(name => {
    const btn = document.createElement("button");
    btn.textContent = name;
    btn.addEventListener("click",  () => aplly(name));
    bar.appendChild(btn);
});

aplly("Gray");