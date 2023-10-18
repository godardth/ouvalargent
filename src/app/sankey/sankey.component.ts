import * as d3 from 'd3';
import { 
  sankey as Sankey,
  sankeyLinkHorizontal as SankeyLinkHorizontal,
  SankeyGraph 
} from 'd3-sankey';
import { Component, OnInit } from '@angular/core';
import SampleJson from '../../assets/france.json';

@Component({
  selector: 'app-sankey',
  templateUrl: './sankey.component.html',
  styleUrls: ['./sankey.component.sass']
})
export class SankeyComponent implements OnInit {

  inputs: Array<any> = [];
  constants: any = {};
  values: any = {};
  
  // D3 Sankey
  private svg: any;
  private margin = 50;
  private width = 1200 - (this.margin * 2);
  private height = 800 - (this.margin * 2);
  private dataSankey: SankeyGraph<any, any> = {nodes: [], links: []};

  ngOnInit() {
    this.inputs = SampleJson.inputs;
    this.constants = SampleJson.constants;
    this.inputs.forEach(o => this.values[o.variable] = o.default);
    this.createChart();
    this.updateChart();
  }
  
  update(variable: string, value: any) {
    this.values[variable] = parseInt(value);
    this.updateChart();
  }
  
  createChart(): void {
    this.svg = d3.select("#container")
      .append("svg")
      .attr("width", this.width + (this.margin * 2))
      .attr("height", this.height + (this.margin * 2))
      .append("g")
      .attr("transform", "translate(" + this.margin + "," + this.margin + ")");
  }
  
  updateChart() {
    
    // Helpers
    let unique = (arr: Array<any>) => arr.filter((o,i)=>arr.indexOf(o)===i);

    // Prepare Data
    let ref: any = {};
    let rows: Array<any> = [];
    let nodes: Array<string> = [];
    SampleJson.groups.forEach(group => {
      let total: number = 0;
      if (!nodes.includes(group.title)) nodes.push(group.title);
      group.breakdown?.forEach(breakdown => {
        if (!nodes.includes(breakdown.title)) nodes.push(breakdown.title);
        let f = Function('c,v,r', "return "+breakdown.formula);
        let constants = Object.assign(this.constants, group.constants);
        let value = f(constants, this.values, ref);
        console.log(group.title, breakdown.title, value)
        if ("ref" in breakdown) { ref[breakdown.ref as keyof typeof breakdown] = value; }
        if (value > 0) { 
          if (group.direction == 'forward')  rows.push([group.title, breakdown.title, value]);
          if (group.direction == 'backward') rows.push([breakdown.title, group.title, value]);
          total += value;
        }
      });
      if ("ref" in group) ref[group.ref as keyof typeof group] = total;
    });
    
    // Format Nodes & Links in D3-Sankey format
    this.dataSankey.nodes = nodes.map((title: any) => ({name: title}));
    let i = (title: string) => this.dataSankey.nodes.findIndex((o: any) => o.name == title);
    this.dataSankey.links = rows.map((o: any) => ({ source: i(o[0]), target: i(o[1]), value: o[2] }));
    
    console.log(this.values, this.dataSankey);
    
    // Update the chart
    let sankey = Sankey()
      .nodeWidth(10)
      .nodePadding(20)
      .size([this.width, this.height]);
    sankey(this.dataSankey);
    
    // Links
    this.svg.selectAll('.link')
      .data(this.dataSankey.links, (d: any) => `${d.source.name}-${d.target.name}`)
      .enter().append('path')
      .attr('class', 'link')
      .attr('d', SankeyLinkHorizontal())
      .style('stroke-width', (d: any) => Math.max(1, d.width))
      .style('stroke', '#00000022')
      .style('fill', 'none');

    // Nodes
    let n = this.svg
      .selectAll(".node")
      .data(this.dataSankey.nodes, (d: any) => d.name)
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => "translate(" + d.x0 + "," + d.y0 + ")");

    // Nodes - Rectangles
    n.append("rect")
      .attr("height", (d: any) => d.y1 - d.y0)
      .attr("width", sankey.nodeWidth())
      .style("fill", "blue");
    
    // Nodes - Label
    n.append("text")
      .attr("x", -6)
      .attr("y", (d: any) => (d.y1 - d.y0) / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "end")
      .text((d: any) => d.name);
    
  }

}
