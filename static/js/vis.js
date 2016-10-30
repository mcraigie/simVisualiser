//built based on examples provided by http://bl.ocks.org/mbostock 2015

var dataDir = dataDir || "";

function group(d) { return d.grouptype; }
var color = d3.scale.category20b();
function colorByGroup(d) { return color(group(d)); }

//use jquery to get the window dimensions
var width = $( window ).width(),
	height = $( window ).height();

//add the chart svg to the div in the HTML body
var svg = d3.select('#viz')
	.append('svg')
	.attr('width', width)
	.attr('height', height);

//used in getting the links to appear underneath the nodes
svg.append("g").attr("id", "links")
svg.append("g").attr("id", "nodes")

//load in the legend
svg.append("image")
	.attr("xlink:href", dataDir + "images/lengend.png")
	.attr("x", 0)
	.attr("y", 0)
	.attr("width", 151)
	.attr("height", 276);

//	

var node, link;

var voronoi = d3.geom.voronoi()
	.x(function(d) { return d.x; })
	.y(function(d) { return d.y; })
	.clipExtent([[-10, -10], [width+10, height+10]]);

//have not modified
function recenterVoronoi(nodes) {
	var shapes = [];
	voronoi(nodes).forEach(function(d) {
		if ( !d.length ) return;
		var n = [];
		d.forEach(function(c){
			n.push([ c[0] - d.point.x, c[1] - d.point.y ]);
		});
		n.point = d.point;
		shapes.push(n);
	});
	return shapes;
}

//have not modified
var force = d3.layout.force()
	.charge(-7000)
	.friction(0.8)
	.linkDistance(195)
	.size([width, height]);

force.on('tick', function() {
	node.attr('transform', function(d) { return 'translate('+d.x+','+d.y+')'; })
		.attr('clip-path', function(d) { return 'url(#clip-'+d.index+')'; });

	link.attr('x1', function(d) { return d.source.x; })
		.attr('y1', function(d) { return d.source.y; })
		.attr('x2', function(d) { return d.target.x; })
		.attr('y2', function(d) { return d.target.y; });

	var clip = svg.selectAll('.clip')
		.data( recenterVoronoi(node.data()), function(d) { return d.point.index; } );

	clip.enter().append('clipPath')
		.attr('id', function(d) { return 'clip-'+d.point.index; })
		.attr('class', 'clip');
	clip.exit().remove()

	clip.selectAll('path').remove();
	clip.append('path')
		.attr('d', function(d) { return 'M'+d.join(',')+'Z'; });
});

//hacky way to let cherrypy specify the dataset used (eventually via URL parameter)
//while still being able to keep this js file in the static directory (and out of the jinja template directory)
var dataset = document.getElementById('dataset_textarea').value;

//load in the dataset
d3.json(dataDir +'datasets/'+dataset+'.json', function(err, data) {

	//give each node an id. TODO: investigate putting the id in the JSON
	data.nodes.forEach(function(d, i) {
		d.id = i;
	});

	//definition for the arrows used in the conflict links
	svg.append("svg:defs").selectAll("marker")
		.data(["end"])
	  .enter().append("svg:marker")
		.attr("id", String)
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 65) //place the arrow near the middle so it doesnt get obscured by the circles
		.attr("refY", 10) //offset the arrow for visibility. this is where the duplicate arrow differs
		.attr("markerWidth", 15)
		.attr("markerHeight", 15)
		.attr("markerUnits","userSpaceOnUse")
		.attr('opacity', 1)
		.attr('fill', "#990012")
		.attr("orient", "auto")
	  .append("svg:path")
		.attr("d", "M0,-5L10,0L0,5");

	//definition for the paired/duplicate arrow used to get the two arrows back to back
	svg.append("svg:defs").selectAll("marker")
		.data(["end2"])
	  .enter().append("svg:marker")
		.attr("id", String)
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 65) //place the arrow near the middle so it doesnt get obscured by the circles
		.attr("refY", -10) //offset the arrow for visibility. this is where the duplicate arrow differs
		.attr("markerWidth", 15)
		.attr("markerHeight", 15)
		.attr("markerUnits","userSpaceOnUse")
		.attr('opacity', 1)
		.attr('fill', "#990012")
		.attr("orient", "auto")
	  .append("svg:path")
		.attr("d", "M0,-5L10,0L0,5");

	//build links from data
	//note that links and nodes are places under #links
	//and #nodes elements to ensure links are placed below nodes visually
	link = svg.select("#links").selectAll('.link')
		.data( data.links )
	  .enter().append('line')
		.attr('class', function(d) { return (d.type === "conflict") ? ((d.hide === "t") ? 'link duplicate_link' : 'link conflict_link') : 'link'; }) 
		.attr("marker-end", function(d) { return (d.type === "conflict") ? ((d.hide === "t") ? 'url(#end2)' : 'url(#end)') : ''; } )
		.style("stroke-width", function(d) { return (d.magnitude === "h") ? ((d.type === "conflict") ? 15 : 13 ) : ((d.type === "conflict") ? 7 : 5 ) ; })
		.style("stroke-dasharray", function(d) { return (d.type === "conflict") ? "5,8" : ""; });

	//build nodes from data
	node = svg.select("#nodes").selectAll('.node')
		.data( data.nodes )
	  .enter().append('g')
		.attr('title', name)
		.attr('class', 'node')
		.call( force.drag );

	//create dict with all nodes information for the pie chart
	var piedict = {};
	data.nodes.forEach(function(d, i) {
		piedict[d.id] = [{ label: "nc", count: d.nc},{ label: "lc", count: d.lc},{ label: "mc", count: d.mc },{ label: "hc", count: d.hc }];
	});

	var pieraddict = {};
	data.nodes.forEach(function(d, i) {
		pieraddict[d.id] = (d.name === "ME") ? 55 : ((d.importance * 6) + 45);
		//pieraddict[d.id] = 55;
	});

	//add labels to nodes
	node.append("text")
		.attr("dx", -20)
		.attr("dy", function(d) { return -1*(pieraddict[d.id]+10) })
		.attr("id", function(d) { return (d.name === "ME") ? 'me_node_text' : ""; })
		.text(function(d) { return d.name });

	//add circles to nodes
  	//scale them to one of 6 sizes
  	node.append('circle')
  	  .attr('r', function(d) { return (d.name === "ME") ? 50 : 0; })
  	  .attr('fill', colorByGroup)
  	  .attr('fill-opacity', 1);

	var pcolor = d3.scale.category20c();
	//['#fee5d9','#fcbba1','#fc9272','#fb6a4a','#de2d26','#a50f15']

	var pcolorcustom = d3.scale.ordinal()
		.domain(["nc", "lc", "mc", "hc"])
		.range(['#fcbba1','#fc9272','#ef3b2c','#67000d']);

	//pie chart size config
	var pwidth = 1;
	var pheight = 1;
	var radius = Math.min(pwidth, pheight) / 2;

	//need to create this in the chain somehow. keeps failing
	var arc = d3.svg.arc()
		.outerRadius(radius);

	var pie = d3.layout.pie()
		.value(function(d) { return d.count; })
		.sort(null);

	node.append("g")
		.attr('width', function(d) { return pieraddict[d.id]*2})
		.attr('height', function(d) { return pieraddict[d.id]*2})
		.attr("id", function(d) { return (d.name === "ME") ? 'test' : ""; })
		.attr('transform', function(d) { return 'scale(' + (pieraddict[d.id]*1.5) + ')'} )
	  .selectAll('path')
		.data(function(d) { return pie(piedict[d.id])} )//piedict[d.id]
	  .enter().append('path')
		.attr('d', arc)
		.attr('fill', function(d, i) { return pcolorcustom(d.data.label); });


	//get things started
	force
		.nodes( data.nodes )
		.links( data.links )
		.start();
});