var seed = 7;
var nodes = null;
var edges = null;
var network = null;

// create an array with nodes
var nodes = new vis.DataSet([
    { id: "1", label: "1" },
    { id: "2", label: "2" },
    { id: "3", label: "3" },
    { id: "4", label: "4" },
    { id: "5", label: "5" },
]);

// create an array with edges
var edges = new vis.DataSet([
    {  label: "a1", from: 1, to: 3, arrows: "to" },
    {  label: "a2", from: 1, to: 2, arrows: "to" },
    {  label: "a3", from: 2, to: 4, arrows: "to" },
    {  label: "a4", from: 2, to: 5, arrows: "to" },
    {  label: "a5", from: 3, to: 3, arrows: "to" },
]);

// create a network
var container = document.getElementById("mynetwork");

// provide the data in the vis format
var data = {
    nodes: nodes,
    edges: edges,
};
var options = {};

var exportArea;

function init() {
    exportArea = document.getElementById("input_output");

    draw();
}

function destroyNetwork() {
    if (network !== null) {
        network.destroy();
        network = null;
    }
}

function draw() {
    destroyNetwork();
    nodes = [];
    edges = [];

    // create a network
    var container = document.getElementById("mynetwork");
    var options = {
        layout: { randomSeed: seed }, // just to make sure the layout is the same when the locale is changed
        // locale: document.getElementById("locale").value,
        manipulation: {
            addNode: function (data, callback) {
                // filling in the popup DOM elements
                document.getElementById("node-operation").innerText = "Add Node";
                editNode(data, clearNodePopUp, callback, true);
            },
            editNode: function (data, callback) {
                // filling in the popup DOM elements
                document.getElementById("node-operation").innerText = "Edit Node";
                editNode(data, cancelNodeEdit, callback, false);
            },
            addEdge: function (data, callback) {
                if (data.from == data.to) {
                    var r = confirm("Do you want to connect the node to itself?");
                    if (r != true) {
                        callback(null);
                        return;
                    }
                }
                document.getElementById("edge-operation").innerText = "Add Edge";
                editEdgeWithoutDrag(data, callback, true);
            },
            editEdge: {
                editWithoutDrag: function (data, callback) {
                    document.getElementById("edge-operation").innerText = "Edit Edge";
                    editEdgeWithoutDrag(data, callback, false);
                },
            },
        },
    };
    network = new vis.Network(container, data, options);
}

function editNode(data, cancelAction, callback, newNode) {
    document.getElementById("node-label").value = data.label;
    document.getElementById("node-saveButton").onclick = saveNodeData.bind(this, data, callback, newNode);
    document.getElementById("node-cancelButton").onclick = cancelAction.bind(this, callback);
    document.getElementById("node-popUp").style.display = "block";
}

// Callback passed as parameter is ignored
function clearNodePopUp() {
    document.getElementById("node-saveButton").onclick = null;
    document.getElementById("node-cancelButton").onclick = null;
    document.getElementById("node-popUp").style.display = "none";
}

function cancelNodeEdit(callback) {
    clearNodePopUp();
    callback(null);
}

function saveNodeData(data, callback, newNode) {
    data.label = document.getElementById("node-label").value;
    if (newNode && network.body.nodeIndices.includes(data.id)) {
        alert("The id " + data.id + " is already in use.");
    } else {
        clearNodePopUp();
        callback(data);
    };
}

function editEdgeWithoutDrag(data, callback, newEdge) {
    // filling in the popup DOM elements
    document.getElementById("edge-label").value = data.label;
    document.getElementById("edge-saveButton").onclick = saveEdgeData.bind(this, data, callback, newEdge);
    document.getElementById("edge-cancelButton").onclick = cancelEdgeEdit.bind(this, callback);
    if (!newEdge) {
        document.getElementById("edge-reverseButton").onclick = reverseEdgeData.bind(this, data, callback);
        document.getElementById("edge-reverseButton").style.display = "block";
    } else {
        document.getElementById("edge-reverseButton").onclick = null;
        document.getElementById("edge-reverseButton").style.display = "none";
    }
    document.getElementById("edge-popUp").style.display = "block";
}

function clearEdgePopUp() {
    document.getElementById("edge-saveButton").onclick = null;
    document.getElementById("edge-cancelButton").onclick = null;
    document.getElementById("edge-reverseButton").onclick = null;
    document.getElementById("edge-popUp").style.display = "none";
}

function cancelEdgeEdit(callback) {
    clearEdgePopUp();
    callback(null);
}

function saveEdgeData(data, callback, newEdge) {
    if (typeof data.to === "object") data.to = data.to.id;
    if (typeof data.from === "object") data.from = data.from.id;
    data.label = document.getElementById("edge-label").value;
    data.arrows = "to";
    if (newEdge && network.body.edgeIndices.includes(data.id)) {
        alert("The id " + data.id + " is already in use.");
    } else {
        clearEdgePopUp();
        callback(data);
    };
}

function reverseEdgeData(data, callback) {
    var temp = data.from
    data.from = data.to
    data.to = temp
    clearEdgePopUp();
    callback(data);
}


function addConnections(edges){
    return function(elem) {
        // need to replace this with a tree of the network, then get child direct children of the element
        var curEdges = network.getConnectedEdges(elem.id);
        curEdges = curEdges.map(function(elem){
            var n = network.getConnectedNodes(elem);
            return {id: elem, to: n[1], from: n[0]};
        })
        elem.connections = curEdges;
        edges.push(curEdges);
    }
}

function exportNetwork() {
    // clearOutputArea();

    // Find useful information for nodes
    var nodeIds = network.body.nodeIndices;
    var nodeInfo = network.body.nodes;
    var nodeDict = {}
    var nodes = nodeIds.map(function(id){
        nodeDict[id] = {id: id, label: getLabel(nodeInfo[id])};
        return nodeDict[id];
    });

    // Find useful information for edges
    var edgeIds = network.body.edgeIndices;
    var edgeDict = network.body.edges;
    var edges = edgeIds.map(function(id){
        var elem = edgeDict[id];
        return {id: id, to: elem.toId, from: elem.fromId, label: getLabel(elem)};
    });

    return [nodes, edges, nodeDict];
}

function networkToQuiver(nodes, edges, nodeDict){
    function objName(obj){
        if (obj.label == ""){
            return obj.id
        } else {
            return obj.label
        };
    }

    var nodeNames = nodes.map(e => e.label)
    if (nodeNames.length != Array.from(new Set(nodeNames)).length) {
        return "Duplicate node names"
    }
    var edgeNames = edges.map(e => e.label)
    if (edgeNames.length != Array.from(new Set(edgeNames)).length) {
        return "Duplicate edge names"
    }

    var nodeString = nodes.map(objName);
    nodeString = '["' + nodeString.join('", "') + '"]'

    var edgeString = edges.map(function(edge){
        var from = objName(nodeDict[edge.from]);
        var to = objName(nodeDict[edge.to]);
        var edgeName = objName(edge);
        return '["' + [from,to,edgeName].join('", "') + '"]'
    });
    edgeString = '[' + edgeString.join(', ') + ']';

    return "Quiver( " + nodeString + ", " + edgeString + " );"
}

function exportToTextBox(){
    var n = exportNetwork();
    var val = networkToQuiver(n[0], n[1], n[2]);
    exportArea.value = val
    // resizeExportArea()
    return val
}

function getLabel(elem) {
    var label;
    try {
        label = elem.labelModule.lines[0].blocks[0].text;
    } catch {
        label = "";
    }
    return label;
}

function objectToArray(obj) {
    return Object.keys(obj).map(function (key) {
        obj[key].id = key;
        return obj[key];
    });
}

function resizeExportArea() {
    exportArea.style.height = (exportArea.scrollHeight - 1) + "px";
}

function importNetwork() {
    var val = exportArea.value

    // Remove unnecessary prefix and suffixes
    val = val.split("(")[1]
    val = val.split(")")
    val = val.slice(0, val.length - 1)
    val = val.join(")").trim()

    // Parse through JSON
    val = JSON.parse("[".concat(val,"]"))

    var nodes = val[0]
    var edges = val[1]

    nodes = nodes.map(function(n){return {id: n, label: n}});
    edges = edges.map(function(e){return {from: e[0], to: e[1], label: e[2], arrows: "to"}})

    nodes = new vis.DataSet(nodes)
    edges = new vis.DataSet(edges)

    data = {
        nodes: nodes,
        edges: edges
    }

    draw()

    return nodes, edges
}

var builtin = {}

init();

