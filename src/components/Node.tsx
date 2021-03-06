import React, {useState} from 'react';
import styled from 'styled-components';
import Draggable, { DraggableEventHandler } from 'react-draggable';
import { Typography } from 'antd';

const { Text, Title } = Typography;

type NodeProps = {
  id: number;
  value: string;
  colorIdx: number;
  position: { x: number; y: number };
  radius: number;
  onDrag: DraggableEventHandler;
  onClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onContextMenu?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  selected: boolean;
  onDoubleClick?: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
};

export const colors = [
  '#DB3737',
  '#BD5A14',
  '#F6CA2E',
  '#27863C',
  '#2A8093',
  '#1E67DC',
  '#C726C9',
  '#944EE9'
];

const StyledNode = styled.div<{
  colorIdx: number;
  radius: number;
  selected: boolean;
  drag: boolean
}>`
  position: absolute;
  display: flex;
  flex-direction: column;
  height: ${({ radius }) => radius * 2}px;
  width: ${({ radius }) => radius * 2}px;
  border: ${({ selected }) => (selected ? '5px solid #FFD700' : null)};
  border-radius: 50%;
  background-color: ${({ colorIdx }) => colors[colorIdx]};
  justify-content: center;
  align-items: center;
  cursor: ${({ drag }) => drag ? `url('https://www.google.com/intl/en_ALL/mapfiles/closedhand.cur'), all-scroll` : `url('https://www.google.com/intl/en_ALL/mapfiles/openhand.cur'), all-scroll`};
`;

export const Node = ({
  id,
  value,
  colorIdx,
  position,
  radius,
  onDrag,
  onClick,
  onContextMenu,
  selected,
  onDoubleClick
}: NodeProps) => {
  const [drag, setDrag] = useState<boolean>(false)

  return (
    <Draggable position={position} onDrag={onDrag} onStart={()=>{setDrag(true)}} onStop={()=>{setDrag(false)}}>
      <StyledNode
        colorIdx={colorIdx}
        id={id.toString()}
        radius={radius}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onDoubleClick={onDoubleClick}
        selected={selected}
        drag={drag}
      >
        <div>
          <Text>{value}</Text>
        </div>
        <div>
          <Title>{id}</Title>
        </div>
      </StyledNode>
    </Draggable>
  );
};
