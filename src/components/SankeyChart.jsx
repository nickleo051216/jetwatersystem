
import React, { useEffect, useRef, useMemo } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';

const SankeyChart = ({ lines, width = 1100, height = 600 }) => {
  const svgRef = useRef(null);

  // Transform lines data into graph (nodes, links)
  const graph = useMemo(() => {
    const nodes = [];
    const links = [];
    const nodeMap = new Map(); // id -> index

    // Helper to get or add node
    const getOrAddNode = (id, props = {}) => {
      let node = nodes.find(n => n.id === id);
      if (!node) {
        node = { id, index: nodes.length, ...props };
        nodes.push(node);
        nodeMap.set(id, node.index);
      } else {
        // Merge props if existing (e.g. updating name)
        Object.assign(node, props);
      }
      return node;
    };

    lines.forEach(line => {
      // 1. Line Inlet (Source)
      const sourceId = `source-${line.id}`;
      getOrAddNode(sourceId, { name: line.name + " 進流", type: 'source' });

      let prevUnit = null;

      line.units.forEach((unit, idx) => {
        // 2. Unit Node
        getOrAddNode(unit.id, { name: unit.name, type: 'unit', icon: unit.icon, flowId: unit.flowId });

        // 3. Link from prev (or source) to current unit
        if (idx === 0) {
          links.push({
            source: sourceId,
            target: unit.id,
            value: unit.inletFlow || 1, // Prevent 0 width
            uom: 'CMD',
            type: 'main' // Main flow
          });
        } else if (prevUnit) {
          links.push({
            source: prevUnit.id,
            target: unit.id,
            value: unit.inletFlow || 1,
            uom: 'CMD',
            type: 'main'
          });
        }

        // 4. Additional Inlets (e.g. RAS)
        if (unit.additionalInlets && unit.additionalInlets.length > 0) {
          unit.additionalInlets.forEach(inlet => {
            const inletNodeId = `add-inlet-${inlet.id}`;
            getOrAddNode(inletNodeId, { name: inlet.name, type: 'inlet', icon: inlet.icon });

            links.push({
              source: inletNodeId,
              target: unit.id,
              value: inlet.flow || 0.1,
              uom: 'CMD',
              type: inlet.type === 'RAS' ? 'return' : 'chemical' // Distinguish types
            });
          });
        }

        // Update prev
        prevUnit = unit;
      });

      // 5. Final Discharge
      if (prevUnit) {
        const exitId = `exit-${line.id}`;
        getOrAddNode(exitId, { name: "放流", type: 'discharge' });
        links.push({
          source: prevUnit.id,
          target: exitId,
          value: prevUnit.outletFlow || 1,
          uom: 'CMD',
          type: 'main'
        });
      }
    });

    // Remap links to use indices
    const finalLinks = links.map(link => ({
      ...link,
      source: nodeMap.get(link.source),
      target: nodeMap.get(link.target)
    })).filter(l => l.source !== undefined && l.target !== undefined);

    return { nodes, links: finalLinks };
  }, [lines]);


  useEffect(() => {
    if (!graph.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear prev

    const { nodes, links } = d3Sankey()
      .nodeWidth(120) // Slightly wider for unit boxes
      .nodePadding(20)
      .extent([[10, 10], [width - 10, height - 10]])
      // .nodeAlign(d3.sankeyLeft) // Optional
      (JSON.parse(JSON.stringify(graph))); // Deep copy for d3 mutation

    // --- Draw Links ---
    const link = svg.append("g")
      .attr("fill", "none")
      .attr("stroke-opacity", 0.4)
      .selectAll("g")
      .data(links)
      .join("g")
      .style("mix-blend-mode", "screen"); // Better for dark mode

    // Gradient defs could go here

    link.append("path")
      .attr("d", sankeyLinkHorizontal())
      .attr("stroke", d => {
        if (d.type === 'return') return "#F59E0B"; // Orange for RAS
        if (d.type === 'chemical') return "#EC4899"; // Pink for Chem
        return "#10B981"; // Green for Water (Standard for Permit Application)
      })
      .attr("stroke-dasharray", d => d.type === 'return' ? "5,5" : "none") // Dashed for return
      .attr("stroke-width", d => Math.max(1, d.width))
      .transition().duration(500)
      .attr("stroke-opacity", 0.5);

    // Link Labels (CMD)
    link.append("text")
      .attr("x", d => (d.source.x1 + d.target.x0) / 2)
      .attr("y", d => (d.y0 + d.y1) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => `Q = ${d.value} ${d.uom}`)
      .attr("fill", "#94A3B8") // Slate-400
      .style("font-size", "10px")
      .style("background", "rgba(0,0,0,0.5)");


    // --- Draw Nodes ---
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // Node Box
    node.append("rect")
      .attr("height", d => d.y1 - d.y0)
      .attr("width", d => d.x1 - d.x0)
      .attr("fill", "#1E293B") // Slate-800
      .attr("stroke", "#38BDF8") // Cyan-400
      .attr("stroke-width", 1)
      .attr("rx", 4);

    // Node Title (Top)
    node.append("text")
      .attr("x", d => (d.x1 - d.x0) / 2)
      .attr("y", -6)
      .attr("text-anchor", "middle")
      .text(d => d.flowId || "") // T01-01 etc
      .attr("fill", "#FFFFFF")
      .style("font-weight", "bold")
      .style("font-size", "12px");

    // Node Name (Inside)
    node.append("text")
      .attr("x", d => (d.x1 - d.x0) / 2)
      .attr("y", d => (d.y1 - d.y0) / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .text(d => d.name)
      .attr("fill", "#E2E8F0")
      .style("font-size", "12px")
      .each(function (d) {
        // Wrap text if needed (simple version)
        const width = d.x1 - d.x0;
        if (this.getComputedTextLength() > width) {
          // Basic wrapping logic could go here
        }
      });

    // Node Icon (if available) - optional position

    // Interaction
    node.on("click", (e, d) => {
      console.log("Clicked:", d);
      // Could callback to parent to select unit
    });

  }, [graph, width, height]);


  return (
    <div className="w-full overflow-auto bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
      <svg ref={svgRef} width={width} height={height} className="mx-auto"></svg>
    </div>
  );
};

export default SankeyChart;
