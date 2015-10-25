var pdataset = [
  { label: 'Abulia', count: 10 }, 
  { label: 'Betelgeuse', count: 20 },
  { label: 'Cantaloupe', count: 30 },
  { label: 'Dijkstra', count: 40 }
];

var pwidth = 100;
var pheight = 100;
var radius = Math.min(pwidth, pheight) / 2;

var pcolor = d3.scale.category20b();

//function delayedscript(){
//  return function(){
//    d3.select("#piechart")
//    .attr('width', pwidth)
//    .attr('height', pheight)
//    .append('g')
//    .attr('transform', 'translate(' + (pwidth / 2) + ',' + (pheight / 2) + ')');
//  }
//}

//var psvg = setTimeout(delayedscript(), 7000);

var psvg = d3.select("piechart")
  .attr('width', pwidth)
  .attr('height', pheight)
  .append('g')
  .attr('transform', 'translate(' + (pwidth / 2) + 
    ',' + (pheight / 2) + ')');

var arc = d3.svg.arc()
  .outerRadius(radius);

var pie = d3.layout.pie()
  .value(function(d) { return d.count; })
  .sort(null);

var path = psvg.selectAll('path')
  .data(pie(pdataset))
  .enter()
  .append('path')
  .attr('d', arc)
  .attr('fill', function(d, i) { 
    return pcolor(d.data.label);
  });