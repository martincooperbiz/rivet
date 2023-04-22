import { ChartNode } from './NodeBase';
import { UserInputNode, UserInputNodeImpl } from './nodes/UserInputNode';
import { NodeImpl } from './NodeImpl';
import { BranchNode, BranchNodeImpl } from './nodes/BranchNode';
import { InterpolateNode, InterpolateNodeImpl } from './nodes/InterpolateNode';
import { ChatNode, ChatNodeImpl } from './nodes/ChatNode';
import { PromptNode, PromptNodeImpl } from './nodes/PromptNode';
import { match } from 'ts-pattern';

export type Nodes = UserInputNode | BranchNode | InterpolateNode | ChatNode | PromptNode;

export type NodeType = Nodes['type'];

export const createNodeInstance = <T extends Nodes>(node: T): NodeImpl<ChartNode> => {
  return match(node as Nodes)
    .with({ type: 'userInput' }, (node) => new UserInputNodeImpl(node))
    .with({ type: 'branch' }, (node) => new BranchNodeImpl(node))
    .with({ type: 'interpolate' }, (node) => new InterpolateNodeImpl(node))
    .with({ type: 'chat' }, (node) => new ChatNodeImpl(node))
    .with({ type: 'prompt' }, (node) => new PromptNodeImpl(node))
    .exhaustive();
};

export function createUnknownNodeInstance(node: ChartNode): NodeImpl<ChartNode> {
  return createNodeInstance(node as Nodes);
}

export function nodeFactory(type: NodeType): Nodes {
  return match(type)
    .with('userInput', () => UserInputNodeImpl.create())
    .with('branch', () => BranchNodeImpl.create())
    .with('interpolate', () => InterpolateNodeImpl.create())
    .with('chat', () => ChatNodeImpl.create())
    .with('prompt', () => PromptNodeImpl.create())
    .exhaustive();
}

export const nodeDisplayName: Record<NodeType, string> = {
  userInput: 'User Input',
  branch: 'Branch',
  interpolate: 'Interpolate',
  chat: 'Chat',
  prompt: 'Prompt',
};
