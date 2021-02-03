<!-- https://bl.ocks.org/d3noob/5d621a60e2d1d02086bf 
https://gomakethings.com/how-to-get-all-of-an-elements-siblings-with-vanilla-js/
http://bl.ocks.org/WilliamQLiu/76ae20060e19bf42d774 -->

<!DOCTYPE html>
<meta charset="utf-8">
<style>
    .axis--x path {
        display: none;
    }

    .line {
        fill: none;
        stroke: steelblue;
        stroke-width: 1.5px;
    }
</style>
<svg width="960" height="500"></svg>
<!-- <script src="//d3js.org/d3.v4.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/d3-require@6"></script> -->
<script src="https://d3js.org/d3.v6.min.js"></script>

<script>

    var getSiblings = function (elem) {

        // Setup siblings array and get the first sibling
        var siblings = [];
        var sibling = elem.parentNode.firstChild;

        // Loop through each sibling and push to the array
        while (sibling) {

            if (sibling.nodeType === 1 && sibling !== elem && sibling.getAttribute("class") == "city") {
                siblings.push(sibling);
            }
            sibling = sibling.nextSibling
        }

        return siblings;

    };

    function zoomed(event) {
        const xz = event.transform.rescaleX(x);
        path.attr("d", area(data, xz));
        gx.call(xAxis, xz);
    }

    margin = ({ top: 20, right: 20, bottom: 30, left: 30 })
    height = 500

    const zoom = d3.zoom()
        .scaleExtent([1, 32])
        .extent([[margin.left, 0], [width - margin.right, height]])
        .translateExtent([[margin.left, -Infinity], [width - margin.right, Infinity]])
        .on("zoom", zoomed);

    area = (data, x) => d3.area()
        .curve(d3.curveStepAfter)
        .x(d => x(d.date))
        .y0(y(0))
        .y1(d => y(d.value))

    yAxis = (g, y) => g
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(y).ticks(null, "s"))
        .call(g => g.select(".domain").remove())
        .call(g => g.select(".tick:last-of-type text").clone()
            .attr("x", 3)
            .attr("text-anchor", "start")
            .attr("font-weight", "bold")
            .text(data.y))
    xAxis = (g, x) => g
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(x).ticks(width / 80).tickSizeOuter(0))


    // filtering and brushing
    var svg = d3.select("svg")
        .call(d3.zoom().on("zoom", function () {
            svg.attr("transform", event.transform)
        }))
        ,
        margin = { top: 20, right: 80, bottom: 30, left: 50 },
        width = svg.attr("width") - margin.left - margin.right,
        height = svg.attr("height") - margin.top - margin.bottom,
        g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
        ;

    //for zoom

    //for zoom
    svg.append("clipPath")
        .attr("id", "clipID")
        .append("rect")
        .attr("x", margin.left)
        .attr("y", margin.top)
        .attr("width", width - margin.left - margin.right)
        .attr("height", height - margin.top - margin.bottom);

    var parseTime = d3.timeParse("%Y%m%d");

    var x = d3.scaleTime().range([0, width]).nice(),
        y = d3.scaleLinear().range([height, 0]),
        z = d3.scaleOrdinal(d3.schemeCategory10);

    var line = d3.line()
        .curve(d3.curveBasis)
        .x(function (d) { return x(d.date); })
        .y(function (d) { return y(d.temperature); });


    d3.tsv("data.tsv", type).then(data => {
        //console.log({data})
        var parseTime = d3.timeParse("%Y%m%d");

        var cities = data.columns.slice(1).map(function (id) {
            return {
                id: id,
                values: data.map(function (d) {
                    return { date: d.date, temperature: d[id] };
                })
            };
        });

        x.domain(d3.extent(data, function (d) {
            return d.date;
        }));

        y.domain([
            d3.min(cities, function (c) { return d3.min(c.values, function (d) { return d.temperature; }); }),
            d3.max(cities, function (c) { return d3.max(c.values, function (d) { return d.temperature; }); })
        ]);

        z.domain(cities.map(function (c) {
            return c.id;
        }));

        g.append("g")
            .attr("class", "axis axis--x")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x));

        g.append("g")
            .attr("class", "axis axis--y")
            .call(d3.axisLeft(y))
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", "0.71em")
            .attr("fill", "#000")
            .text("Temperature, ºF");

        var city = g.selectAll(".city")
            .data(cities)
            .enter().append("g")
            .attr("class", "city");


        city.append("path")
            .attr("class", "line")
            .attr("id", "cityLine")
            .attr("clip-path", "clipID") //for zoom
            .attr("d", area(data, x)) //for zoom
            .attr("d", function (d) { return line(d.values); })
            .style("stroke", function (d) { return z(d.id); })
            ;

        // const gx = svg.append("g")
        //     .call(xAxis, x);

        // svg.append("g")
        //     .call(yAxis, y);

        // svg.call(zoom)
        //     .transition()
        //     .duration(750)
        //     .call(zoom.scaleTo, 4, [x(Date.UTC(2001, 8, 1)), 0]);

        var siblingList
        city.append("text")
            .datum(function (d) { return { id: d.id, value: d.values[d.values.length - 1] }; })
            .attr("transform", function (d) { return "translate(" + x(d.value.date) + "," + y(d.value.temperature) + ")"; })
            .attr("x", 3)
            .attr("dy", "0.35em")
            .style("font", "10px sans-serif")
            .on("click", function () {

                siblingList = getSiblings(this.parentNode);
                siblingList.forEach(element => {
                    d3.select(element.firstChild)
                        .style("stroke", function (d) { return z(d.id); });
                });
                // Determine if current line is visible
                var active = cityLine.active ? false : true,
                    newOpacity = active ? 0 : 1;
                // Hide or show the elements
                d3.select(this.parentNode.firstChild)
                    .style("opacity", newOpacity);
                // Update whether or not the elements are active
                cityLine.active = active;

            })
            .on('mouseover', function (d) {
                siblingList = getSiblings(this.parentNode);

                var active = cityLine.active ? false : true,
                    newOpacity = active ? 0 : 1;
                siblingList.forEach(element => {
                    d3.select(element.firstChild)
                        .style("stroke", "#acada8");
                    // Update whether or not the elements are active
                    cityLine.active = active;
                });

            })
            .on('mouseout', function (d) {
                siblingList.forEach(element => {
                    d3.select(element.firstChild)
                        .style("stroke", function (d) { return z(d.id); });
                });
            })
            .text(function (d) {
                return d.id;
            });
    })
        .catch(err => console.log())

    function type(d, _, columns) {
        d.date = parseTime(d.date);
        for (var i = 1, n = columns.length, c; i < n; ++i) d[c = columns[i]] = +d[c];
        return d;
    }

</script>