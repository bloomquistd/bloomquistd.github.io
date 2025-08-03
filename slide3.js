    const svg = d3.select("svg"),
          margin = {top: 40, right: 30, bottom: 60, left: 80},
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const tooltip = d3.select(".tooltip");
    svg.append("text")
        .attr("x", width/1.75)
        .attr("y", margin.top) 
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Immigration Forms Pending per Quarter (USCIS)");
    
    svg.append("text")
        .attr("x", width/1.75)
        .attr("y", margin.top+height+margin.bottom-5) 
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Hover over the chart to see a breakdown by category!");
        
    d3.csv("/Data/quarterly_all_forms_2023Q4-2025Q2.csv", d3.autoType).then(data => {
      data.forEach(d => {
        d.label = `${d.year} ${d.quarter}`;
      });

      
      data.sort((a, b) => {
        const q = qStr => parseInt(qStr.replace("Q", ""));
        return a.year - b.year || q(a.quarter) - q(b.quarter);
      });

      
      const summary = d3.rollups(
        data,
        v => d3.sum(v, d => d.pending),
        d => d.label
      ).map(([label, total]) => ({ label, total }));

      
      const tooltipData = {};
      data.forEach(d => {
        if (!tooltipData[d.label]) tooltipData[d.label] = {};
        tooltipData[d.label][d.base_type] = (tooltipData[d.label][d.base_type] || 0) + d.pending;
      });

      const x = d3.scalePoint()
        .domain(summary.map(d => d.label))
        .range([0, width])
        .padding(0.5);

      const y = d3.scaleLinear()
        .domain([0, d3.max(summary, d => d.total) * 1.1])
        .nice()
        .range([height, 0]);

      
      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

      
      g.append("g").call(d3.axisLeft(y));

     
      const line = d3.line()
        .x(d => x(d.label))
        .y(d => y(d.total));

      g.append("path")
        .datum(summary)
        .attr("fill", "none")
        .attr("stroke", "#9467bd")
        .attr("stroke-width", 2)
        .attr("d", line);

      
      g.selectAll("circle")
        .data(summary)
        .join("circle")
        .attr("cx", d => x(d.label))
        .attr("cy", d => y(d.total))
        .attr("r", 5)
        .attr("id","pending")
        .on("mouseover", function(event, d) {
          const breakdown = tooltipData[d.label] || {};
          const total = d3.sum(Object.values(breakdown)).toLocaleString();
          const content = `<strong>${d.label} — Pending: ${total}</strong><br>` +
            Object.entries(breakdown)
              .map(([cat, val]) => `${cat}: ${val.toLocaleString()}`)
              .join("<br>");

          tooltip.html(content)
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY - 20) + "px")
            .transition()
            .duration(150)
            .style("opacity", 1);
        })
        .on("mouseout", function() {
          tooltip.transition().duration(200).style("opacity", 0);
        });

        g.append("line")
        .attr("x1", 585) 
        .attr("x2", 585) 
        .attr("y1", 10) 
        .attr("y2", height) 
        .attr("stroke", "black") 
        .attr("stroke-width", 1) 
        .style("stroke-dasharray", ("3, 3")); 
        const annotations = [
        {
          note: { label: "Trump's Second Inaugruation" },
          x: 585,
          y: 105,
          dy: 120,
          dx: -162,
          subject: { radius: 100, radiusPadding: 10 },
          connector: {end: "arrow"},
        }
      ];

      const makeAnnotations = d3.annotation().annotations(annotations);
      
      g.append("g")
          .attr("class", "annotation-group")
          .call(makeAnnotations)
    });