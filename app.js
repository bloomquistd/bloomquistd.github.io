const canvas = d3.select("canva")

const svg = canvas.append("svg")
    .attr("height",1000)
    .attr("width",1000)
   // .attr("id","scalesvg")
   // .attr("viewBox","0 0 1000 1000");

const margin = {top: 20, right: 20, bottom: 70, left: 70};
const graphWidth = 600 - margin.left - margin.right;
const graphHeight = 600 - margin.top - margin.bottom;

const mainCanvas = svg.append("g")
    .attr("width", graphWidth / 2)
    .attr("height", graphHeight / 2)
    .attr("transform", `translate(${margin.left},${margin.top}+160)`);

function getCSV(){
    
}


