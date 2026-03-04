'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as d3 from 'd3';
import axios from 'axios';
import { ZoomIn, ZoomOut, RotateCcw, Users, AlertTriangle } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  type: 'super_admin' | 'manager' | 'client';
  churnRisk?: boolean;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  churnRisk?: boolean;
}

interface NetworkData {
  nodes: Node[];
  links: Link[];
}

const NeuralNetworkMap: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<NetworkData>({ nodes: [], links: [] });
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNetworkData();
  }, []);

  const fetchNetworkData = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration - replace with actual API call
      const mockData: NetworkData = {
        nodes: [
          { id: 'admin', name: 'System Admin', type: 'super_admin' },
          { id: 'manager1', name: 'John Doe', type: 'manager' },
          { id: 'manager2', name: 'Jane Smith', type: 'manager' },
          { id: 'client1', name: 'TechCorp', type: 'client' },
          { id: 'client2', name: 'InnovateCo', type: 'client', churnRisk: true },
          { id: 'client3', name: 'GlobalTech', type: 'client' }
        ],
        links: [
          { source: 'admin', target: 'manager1' },
          { source: 'admin', target: 'manager2' },
          { source: 'manager1', target: 'client1' },
          { source: 'manager1', target: 'client2' },
          { source: 'manager2', target: 'client3' }
        ]
      };

      setData(mockData);

      // Uncomment when API is ready
      // const response = await axios.get('/api/admin/neural-network');
      // setData(response.data);
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data.nodes.length || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = 800;
    const height = 600;

    // Clear previous render
    svg.selectAll('*').remove();

    // Create force simulation
    const simulation = d3.forceSimulation<Node>(data.nodes)
      .force('link', d3.forceLink<Node, Link>(data.links).id(d => d.id).distance(120))
      .force('charge', d3.forceManyBody().strength(-400))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    // Create links
    const linkGroup = svg.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(data.links)
      .enter().append('line')
      .attr('stroke', d => d.churnRisk ? '#ef4444' : '#10b981')
      .attr('stroke-width', d => d.churnRisk ? 3 : 2)
      .attr('stroke-dasharray', d => d.churnRisk ? '5,5' : 'none')
      .attr('opacity', 0.7);

    // Create nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll('circle')
      .data(data.nodes)
      .enter().append('circle')
      .attr('r', d => d.type === 'super_admin' ? 25 : d.type === 'manager' ? 20 : 15)
      .attr('fill', d => {
        switch(d.type) {
          case 'super_admin': return '#ef4444';
          case 'manager': return '#3b82f6';
          case 'client': return '#10b981';
          default: return '#6b7280';
        }
      })
      .attr('stroke', d => d.churnRisk ? '#ef4444' : '#ffffff')
      .attr('stroke-width', d => d.churnRisk ? 3 : 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => setSelectedNode(d))
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }));

    // Add glow effect for nodes
    nodeGroup
      .selectAll<SVGCircleElement, Node>('circle')
      .style('filter', (d: Node) => d.churnRisk ? 'drop-shadow(0 0 6px #ef4444)' : 'drop-shadow(0 0 4px rgba(255,255,255,0.3))');

    // Add labels
    const labelGroup = svg.append('g').attr('class', 'labels');
    const labels = labelGroup
      .selectAll('text')
      .data(data.nodes)
      .enter().append('text')
      .text(d => d.name)
      .attr('font-size', '12px')
      .attr('fill', '#ffffff')
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.type === 'super_admin' ? 40 : d.type === 'manager' ? 35 : 30)
      .style('pointer-events', 'none')
      .style('text-shadow', '1px 1px 2px rgba(0,0,0,0.8)');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);

      node
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      labels
        .attr('x', d => d.x!)
        .attr('y', d => d.y!);
    });

    // Add zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        const { transform } = event;
        setZoom(transform.k);
        linkGroup.attr('transform', transform.toString());
        nodeGroup.attr('transform', transform.toString());
        labelGroup.attr('transform', transform.toString());
      });

    svg.call(zoomBehavior);

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data]);

  const resetZoom = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(750).call(
        d3.zoom<SVGSVGElement, unknown>().transform,
        d3.zoomIdentity
      );
      setZoom(1);
    }
  };

  const zoomIn = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        1.5
      );
    }
  };

  const zoomOut = () => {
    if (svgRef.current) {
      d3.select(svgRef.current).transition().duration(300).call(
        d3.zoom<SVGSVGElement, unknown>().scaleBy,
        0.75
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      className="relative w-full h-96 bg-black/50 backdrop-blur-xl rounded-xl border border-green-500/30 overflow-hidden"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-10 bg-black/80 p-3 rounded-lg border border-green-500/30">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-white">Super Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-white">Manager</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-white">Client</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-400">High Risk</span>
          </div>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <button
            onClick={zoomIn}
            className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={zoomOut}
            className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetZoom}
            className="p-1 bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-400 ml-2">
            Zoom: {Math.round(zoom * 100)}%
          </span>
        </div>
      </div>

      {/* SVG Container */}
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        className="cursor-move"
        style={{ background: 'transparent' }}
      />

      {/* Node Details Panel */}
      {selectedNode && (
        <motion.div
          className="absolute bottom-4 right-4 bg-black/90 backdrop-blur-xl p-4 rounded-lg border border-green-500/30 max-w-xs"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-white font-bold">{selectedNode.name}</h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <p className="text-gray-300 text-sm mb-2">
            Type: <span className="capitalize">{selectedNode.type.replace('_', ' ')}</span>
          </p>
          {selectedNode.churnRisk && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4" />
              High Churn Risk
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <button className="flex-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
              View Details
            </button>
            <button className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors">
              <Users className="w-3 h-3" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm p-2 rounded text-xs text-gray-400">
        Click and drag nodes • Scroll to zoom • Click nodes for details
      </div>
    </motion.div>
  );
};

export default NeuralNetworkMap;