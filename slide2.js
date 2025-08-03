 const svg = d3.select("svg"),
          margin = {top: 40, right: 30, bottom: 60, left: 80},
          width = +svg.attr("width") - margin.left - margin.right,
          height = +svg.attr("height") - margin.top - margin.bottom;

          
    svg.append("text")
        .attr("x", width/1.75)
        .attr("y", margin.top) 
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", "bold")
        .text("Aggregate Immigration Forms per Quarter (USCIS)");
    
    svg.append("text")
        .attr("x", width/1.75)
        .attr("y", margin.top+height+margin.bottom-5) 
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("font-weight", "bold")
        .text("Hover over the chart to see a breakdown by category!");
    


    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select(".tooltip");

    d3.csv("/Data/quarterly_all_forms_2023Q4-2025Q2.csv", d3.autoType).then(data => {
      // Create a label from year + quarter
      data.forEach(d => {
        d.label = `${d.year} ${d.quarter}`;
      });

      // Sort by year then quarter
      data.sort((a, b) => {
        const getQuarterNum = q => parseInt(q.replace("Q", ""));
        return a.year - b.year || getQuarterNum(a.quarter) - getQuarterNum(b.quarter);
      });

      // Aggregate totals per label (quarter)
      const summary = d3.rollups(
        data,
        v => ({
          received: d3.sum(v, d => d.received),
          approved: d3.sum(v, d => d.approved),
          denied: d3.sum(v, d => d.denied),
        }),
        d => d.label
      ).map(([label, vals]) => ({ label, ...vals }));

      // Organize tooltip breakdowns
      const tooltipData = {};
      data.forEach(d => {
        const label = d.label;
        if (!tooltipData[label]) tooltipData[label] = { received: {}, approved: {}, denied: {} };
        ["received", "approved", "denied"].forEach(type => {
          tooltipData[label][type][d.base_type] = (tooltipData[label][type][d.base_type] || 0) + d[type];
        });
      });

      const subgroups = ["received", "approved", "denied"];
      const groups = summary.map(d => d.label);

      const x0 = d3.scaleBand().domain(groups).range([0, width]).padding(0.2);
      const x1 = d3.scaleBand().domain(subgroups).range([0, x0.bandwidth()]).padding(0.05);
      const y = d3.scaleLinear()
        .domain([0, d3.max(summary, d => Math.max(d.received, d.approved, d.denied)) * 1.1])
        .nice()
        .range([height, 0]);
      const color = d3.scaleOrdinal().domain(subgroups).range(['#1f77b4', '#2ca02c', '#d62728']);

      g.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x0))
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

      g.append("g").call(d3.axisLeft(y));

      g.append("g")
        .selectAll("g")
        .data(summary)
        .join("g")
          .attr("transform", d => `translate(${x0(d.label)},0)`)
        .selectAll("rect")
        .data(d => subgroups.map(key => ({ key, value: d[key], label: d.label }))) 
        .join("rect")
          .attr("x", d => x1(d.key))
          .attr("y", d => y(d.value))
          .attr("width", x1.bandwidth())
          .attr("height", d => height - y(d.value))
          .attr("fill", d => color(d.key))
          .attr("class", "bar")
          .on("mouseover", function(event, d) {
            const breakdown = tooltipData[d.label][d.key];
            const total = d3.sum(Object.values(breakdown)).toLocaleString();
            const content = `<strong>${d.label} — ${d.key.charAt(0).toUpperCase() + d.key.slice(1)}: ${total}</strong><br>` +
              Object.entries(breakdown).map(([cat, val]) => `${cat}: ${val.toLocaleString()}`).join("<br>");
            tooltip.html(content)
              .style("left", (event.pageX + 15) + "px")
              .style("top", (event.pageY - 20) + "px")
              .transition()
              .duration(150)
              .style("opacity", 1);
            d3.select(this).style("opacity", 0.7);
          })
          .on("mouseout", function() {
            tooltip.transition().duration(200).style("opacity", 0);
            d3.select(this).style("opacity", 1);
          });

      // Add legend
      const legend = svg.append("g")
        .attr("transform", `translate(${width + margin.left - 100},0)`);

      subgroups.forEach((key, i) => {
        const g = legend.append("g").attr("transform", `translate(0, ${i * 20})`);
        g.append("rect")
          .attr("width", 15)
          .attr("height", 15)
          .attr("fill", color(key));
        g.append("text")
          .attr("x", 20)
          .attr("y", 12)
          .text(key.charAt(0).toUpperCase() + key.slice(1));
      });
      
      const annotations = [
        {
          note: { label: "Large increase in the number of forms received." },
          x: 740,
          y: 100,
          dy: -20,
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