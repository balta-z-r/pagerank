import React, { useState, useEffect } from 'react';
import { Node, colors } from './components';
import { notification, Menu, Modal, Button } from 'antd';
import graph from 'pagerank.js';

const RADIUS = 50;

const xMin = 0;
const yMin = 0;
const xMax = window.innerWidth - RADIUS * 3;
const yMax = window.innerHeight - RADIUS * 3;

type Node = {
  position: { x: number; y: number };
  id: number;
};

type Link = {
  from: number;
  to: number;
  weight: number;
};

const defaultNodes: Node[] = [
  { position: { x: Math.min(50, xMax), y: Math.min(50, yMax) }, id: 0 },
  { position: { x: Math.min(300, xMax), y: Math.min(250, yMax) }, id: 1 },
  { position: { x: Math.min(360, xMax), y: Math.min(80, yMax) }, id: 2 },
  { position: { x: Math.min(70, xMax), y: Math.min(300, yMax) }, id: 3 },
  { position: { x: Math.min(600, xMax), y: Math.min(250, yMax) }, id: 4 },
  { position: { x: Math.min(370, xMax), y: Math.min(500, yMax) }, id: 5 }
];

const defaultLinks: Link[] = [
  { from: 0, to: 1, weight: 1 },
  { from: 1, to: 2, weight: 1 },
  { from: 1, to: 3, weight: 2 },
  { from: 1, to: 4, weight: 1 },
  { from: 1, to: 5, weight: 1 },
  { from: 2, to: 0, weight: 1 },
  { from: 2, to: 4, weight: 1 },
  { from: 3, to: 0, weight: 1 },
  { from: 3, to: 5, weight: 1 },
  { from: 5, to: 2, weight: 1 }
];

const App = () => {
  const [nodes, setNodes] = useState<Node[]>(defaultNodes);

  const [links, setLinks] = useState<Link[]>(defaultLinks);

  const [selected, setSelected] = useState<number | undefined>(undefined);

  const [menuCoords, setMenuCoords] = useState<
    { x: number; y: number } | undefined
  >(undefined);

  const [modal, setModal] = useState<boolean>(true);
  const [linking, setLinking] = useState<boolean>(true);

  useEffect(() => {
    document.addEventListener('mousedown', (e: Event) => {
      if (e.target === document.body) {
        setSelected(undefined);
        setMenuCoords(undefined);
      }
    });
    document.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      if (e.target === document.body)
        setMenuCoords({ x: e.clientX, y: e.clientY });
    });
  }, []);

  const addNode = () => {
    setNodes((prevNodes) => {
      const newId =
        prevNodes.reduce((prevId, { id }) => (id > prevId ? id : prevId), 0) +
        1;
      return [
        ...prevNodes,
        {
          position: { x: menuCoords!.x, y: menuCoords!.y },
          id: newId
        }
      ];
    });
    setMenuCoords(undefined);
  };

  const removeNode = (id: number) => {
    setNodes((prevNodes) =>
      prevNodes.filter(({ id: nodeId }) => nodeId !== id)
    );
    setLinks((prevLinks) =>
      prevLinks.filter(({ to, from }) => to !== id && from !== id)
    );
  };

  const contextMenu = (
    <Menu
      onClick={addNode}
      style={{
        position: 'absolute',
        top: (menuCoords && menuCoords.y) || 0,
        left: (menuCoords && menuCoords.x) || 0,
        boxShadow: '0 10px 15px 0 rgba(0,0,0,0.2)'
      }}
    >
      <Menu.Item>Add Node</Menu.Item>
    </Menu>
  );

  const handleRightClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    id: number
  ) => {
    e.preventDefault();
    if (selected !== undefined) {
      if (selected !== id) {
        const idx = links.findIndex(
          ({ from, to }) => from === selected && to === id
        );
        if (linking) {
          if (idx !== -1) {
            const weight = links[idx].weight + 1;
            setLinks((prevLinks) => {
              const newLinks = [...prevLinks];
              newLinks[idx] = { from: selected, to: id, weight: weight };
              return newLinks;
            });
            notification.success({
              message: `Increased the weight of link to ${weight}`
            });
          } else {
            setLinks((prevLinks) => [
              ...prevLinks,
              { from: selected, to: id, weight: 1 }
            ]);
            notification.success({ message: 'Linked successfully' });
          }
        } else {
          if (idx !== -1) {
            setLinks((prevLinks) => {
              const newLinks = [...prevLinks];
              newLinks.splice(idx, 1);
              return newLinks;
            });
            notification.success({ message: 'Linked removed successfully' });
          }
        }
      }
      setSelected(undefined);
    } else setSelected(id);
  };

  graph.reset();

  const visited = new Set();
  links.forEach(({ from, to, weight }) => {
    for (let i = 0; i < weight; i++) graph.link(from, to);

    visited.add(from);
    visited.add(to);
  });

  const leftover = nodes.filter(({ id }) => !visited.has(id));
  leftover.forEach(({ id }) => graph.link(id, id));

  const ranks: string[] = [];
  graph.rank(0.81, 0.000001, (node: number, rank: number) => {
    ranks[node] = rank.toFixed(3);
  });

  const nodesComponent = nodes.map(({ position, id }, idx) => (
    <Node
      value={ranks[id] || '0.000'}
      id={id}
      colorIdx={id % colors.length}
      position={position}
      radius={RADIUS}
      onDrag={(e, data) => {
        let { x, y } = data;
        x = Math.min(x, xMax);
        x = Math.max(x, xMin);
        y = Math.min(y, yMax);
        y = Math.max(y, yMin);
        const newNodes = [...nodes];
        const idx = newNodes.findIndex(({ id: nodeId }) => nodeId === id);
        newNodes[idx] = { ...newNodes[idx], position: { x, y } };
        setNodes(newNodes);
      }}
      onContextMenu={(e) => {
        handleRightClick(e, id);
      }}
      selected={selected === id}
      onDoubleClick={() => {
        removeNode(id);
      }}
      key={id}
    />
  ));

  const linksComponent = links.map(({ from, to, weight }, idx) => {
    const startNode = nodes.find(({ id }) => id === from);
    const endNode = nodes.find(({ id }) => id === to);

    if (!startNode || !endNode) return <></>;

    const {
      position: { x: x1, y: y1 }
    } = startNode;
    const {
      position: { x: x2, y: y2 }
    } = endNode;

    const mag = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const offsetX = ((RADIUS + 10 * weight) * (x2 - x1)) / mag;
    const offsetY = ((RADIUS + 10 * weight) * (y2 - y1)) / mag;

    return (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox={`0 0 ${window.innerWidth} ${window.innerHeight}`}
        style={{ position: 'absolute', top: 0, zIndex: -1 }}
        key={idx}
      >
        <defs>
          <marker
            id='arrowhead'
            markerWidth='10'
            markerHeight='7'
            refX='0'
            refY='3.5'
            orient='auto'
          >
            <polygon points='0 0, 10 3.5, 0 7' />
          </marker>
        </defs>
        <line
          x1={x1 + RADIUS}
          y1={y1 + RADIUS}
          x2={x2 + RADIUS - offsetX}
          y2={y2 + RADIUS - offsetY}
          stroke='#000'
          strokeWidth={weight}
          markerEnd='url(#arrowhead)'
        />
      </svg>
    );
  });

  return (
    <>
      <div>
        {nodesComponent}
        {linksComponent}
        {menuCoords ? contextMenu : null}
      </div>

      <div>
        <Button
          onClick={() => {
            setLinking((prevState) => !prevState);
          }}
          style={{ position: 'absolute' }}
        >
          {linking ? 'Linking' : 'Unlinking'}
        </Button>
        {nodesComponent}
        {linksComponent}
        {menuCoords ? contextMenu : null}
      </div>
      <Modal
        title='Instructions'
        visible={modal}
        onOk={() => {
          setModal(false);
        }}
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>You can drag the nodes around</p>
        <p>
          Right click node to node to link / unlink them depending on linking
          state
        </p>
        <p>
          Change linking state from linking to unlinking and vice versa by
          clicking the button on the top left
        </p>
        <p>Double click a node to delete it</p>
        <p>Right click blank space and select "Add Node" to add a node</p>
      </Modal>
    </>
  );
};

export default App;
