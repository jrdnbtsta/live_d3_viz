(function () {
	const socket = io.connect();

	let settings;

	//Socket to listen for new data. Only invoke render functions if data is present.
	//Since our viz will have both static and changing components, both need to be separated into two functions
	socket.on('SEND_DATA', (data) => {
		if (data.length > 0) {
			if (!settings) settings = drawSVG(data)
			drawContent(settings, data);
		}
	});

	let margin = { top: 20, right: 80, bottom: 50, left: 80 },
		width = 800 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

	//Function invoked only when an SVG does not already exist in DOM
	function drawSVG(data) {

		d3.select('#bar-graph').selectAll('svg').remove();

		//Append an SVG component to the DOM
		let svg = d3.select('#bar-graph')
			.append('svg')
			.attr('id', 'barSVG')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom)
			.append('g')
			.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

		//Add a Y-Axis to the SVG component
		let yScale = d3.scaleLinear()
			.domain([0, 70])
			.range([height, 0])

		svg.append('g')
			.attr('id', 'yAxis')
			.call(d3.axisLeft(yScale));

		svg.append("text")
			.attr("transform", "rotate(-90)")
			.attr("y", 0 - margin.left)
			.attr("x", 0 - (height / 2))
			.attr("dy", "1em")
			.style("text-anchor", "middle")
			.text("Miles Per Hour")
			.style('font-size', '20px');

		let colors = ['#3D5A80', '#98C1D9', '#E0FBFC', '#EE6C4D', '#293241'];

		let settings = {
			svg,
			yScale,
			colors,
		}
		return settings;
	}

	//Function invoked each time new data comes in
	function drawContent(settings, data) {
		
		//Add an X-Axis to the SVG Component
		let xScale = d3.scaleBand()
			.paddingOuter(.5)
			.paddingInner(0.1)
			.domain(data.map(d => d.Borough))
			.range([0, width]);

		let xAxis = d3.axisBottom(xScale)
			.ticks(5)
			.tickSize(10)
			.tickPadding(5);

		d3.select('#xAxis').remove();

		settings.svg
			.append('g')
			.attr('id', 'xAxis')
			.attr('transform', `translate(0, ${height})`)
			.call(xAxis)
			.selectAll('text')
			.style("font-size","14px");
		
		//Selection Methods
		
		//BIND DATA
		let columns = settings.svg.selectAll('g.column-container')
			.data(data, d => d.Borough);
		
		//EXIT
		columns.exit().remove();

		//ENTER
		let newColumns = columns
			.enter()
			.append('g')
			.attr('class', 'column-container')

		newColumns.append('rect').transition()
			.duration(1000)
			.style("opacity", 1)
			.attr('class', 'column')
			.attr('x', d => xScale(d.Borough))
			.attr('y', d => settings.yScale(d.Speed))
			.attr('width', d => xScale.bandwidth())
			.attr('height', d => height - settings.yScale(d.Speed))
			.style('fill', (d, i) => settings.colors[i]);

		//UPDATE
		let updateColumns = columns.select('.column');

		updateColumns.transition()
			.duration(1000)
			.style("opacity", 1)
			.attr('width', d => xScale.bandwidth())
			.attr('height', d => height - settings.yScale(d.Speed))
			.attr('x', d => xScale(d.Borough))
			.attr('y', d => settings.yScale(d.Speed))
	}
})();
