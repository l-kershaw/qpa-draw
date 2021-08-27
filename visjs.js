var seed = 7;
var nodes = null;
var edges = null;
var network = null;
// randomly create some nodes and edges
var nodes = new vis.DataSet([
    { id: 1, label: "1" },
    { id: 2, label: "2" },
    { id: 3, label: "3" },
    { id: 4, label: "4" },
    { id: 5, label: "5" },
]);

// create an array with edges
var edges = new vis.DataSet([
    { label: "a1", from: 1, to: 3, arrows: "to" },
    { label: "a2", from: 1, to: 2, arrows: "to" },
    { label: "a3", from: 2, to: 4, arrows: "to" },
    { label: "a4", from: 2, to: 5, arrows: "to" },
    { label: "a5", from: 3, to: 3, arrows: "to" },
]);

// create a network
var container = document.getElementById("mynetwork");

// provide the data in the vis format
var data = {
    nodes: nodes,
    edges: edges,
};
var options = {};

function destroy() {
    if (network !== null) {
        network.destroy();
        network = null;
    }
}

function draw() {
    destroy();
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
                editNode(data, clearNodePopUp, callback);
            },
            editNode: function (data, callback) {
                // filling in the popup DOM elements
                document.getElementById("node-operation").innerText = "Edit Node";
                editNode(data, cancelNodeEdit, callback);
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
                editEdgeWithoutDrag(data, callback);
            },
            editEdge: {
                editWithoutDrag: function (data, callback) {
                    document.getElementById("edge-operation").innerText = "Edit Edge";
                    editEdgeWithoutDrag(data, callback);
                },
            },
        },
    };
    network = new vis.Network(container, data, options);
}

function editNode(data, cancelAction, callback) {
    document.getElementById("node-label").value = data.label;
    document.getElementById("node-saveButton").onclick = saveNodeData.bind(this, data, callback);
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

function saveNodeData(data, callback) {
    data.label = document.getElementById("node-label").value;
    clearNodePopUp();
    callback(data);
}

function editEdgeWithoutDrag(data, callback) {
    // filling in the popup DOM elements
    document.getElementById("edge-label").value = data.label;
    document.getElementById("edge-saveButton").onclick = saveEdgeData.bind(this, data, callback);
    document.getElementById("edge-cancelButton").onclick = cancelEdgeEdit.bind(this, callback);
    document.getElementById("edge-popUp").style.display = "block";
}

function clearEdgePopUp() {
    document.getElementById("edge-saveButton").onclick = null;
    document.getElementById("edge-cancelButton").onclick = null;
    document.getElementById("edge-popUp").style.display = "none";
}

function cancelEdgeEdit(callback) {
    clearEdgePopUp();
    callback(null);
}

function saveEdgeData(data, callback) {
    if (typeof data.to === "object") data.to = data.to.id;
    if (typeof data.from === "object") data.from = data.from.id;
    data.label = document.getElementById("edge-label").value;
    data.arrows = "to";
    clearEdgePopUp();
    callback(data);
}

function init() {
    // setDefaultLocale();
    draw();
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
    var nodeDict = network.body.nodes;
    var nodes = nodeIds.map(function(id){
        nodeDict[id] = {id: id, label: getLabel(nodeDict[id])};
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

function exportToString(){
    var n = exportNetwork();
    return networkToQuiver(n[0], n[1], n[2]);
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

// function deduplicateByID(array) {
//     var ids = [];
//     var newArray = [];
//     array.forEach( function(elem){
//        if ids.indexOf // hjdshjdsajhadsk
//     });
// }

init();

