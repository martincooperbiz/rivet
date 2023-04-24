import { NodeImpl } from '../NodeImpl';
import { ChartNode, NodeId, NodeInputDefinition, NodeOutputDefinition, PortId } from '../NodeBase';
import { nanoid } from 'nanoid';
import { DataValue, ArrayDataValue, StringDataValue, expectType } from '../DataValue';
import { zip } from 'lodash-es';

export type UserInputNode = ChartNode<'userInput', UserInputNodeData>;

export type UserInputNodeData = {
  prompt: string;
  useInput: boolean;
};

export class UserInputNodeImpl extends NodeImpl<UserInputNode> {
  static create(prompt = 'This is an example question?'): UserInputNode {
    const chartNode: UserInputNode = {
      type: 'userInput',
      title: 'User Input',
      id: nanoid() as NodeId,
      visualData: {
        x: 0,
        y: 0,
        width: 250,
      },
      data: {
        prompt,
        useInput: false,
      },
    };

    return chartNode;
  }

  getInputDefinitions(): NodeInputDefinition[] {
    if (this.chartNode.data.useInput) {
      return [
        {
          dataType: 'string[]',
          id: 'questions' as PortId,
          title: 'Questions',
        },
      ];
    }
    return [];
  }

  getOutputDefinitions(): NodeOutputDefinition[] {
    return [
      {
        dataType: 'string[]',
        id: 'output' as PortId,
        title: 'Answers Only',
      },
      {
        dataType: 'string[]',
        id: 'questionsAndAnswers' as PortId,
        title: 'Q & A',
      },
    ];
  }

  async process(): Promise<Record<PortId, DataValue>> {
    return {
      ['output' as PortId]: undefined!,
      ['questionsAndAnswers' as PortId]: undefined!,
    };
  }

  getOutputValuesFromUserInput(
    questions: Record<PortId, DataValue>,
    answers: ArrayDataValue<StringDataValue>,
  ): Record<PortId, DataValue> {
    const questionsList = this.data.useInput
      ? expectType(questions['questions' as PortId], 'string[]')
      : [this.data.prompt];

    return {
      ['output' as PortId]: answers,
      ['questionsAndAnswers' as PortId]: {
        type: 'string[]',
        value: zip(questionsList, answers.value).map(([q, a]) => `${q}\n${a}`),
      },
    };
  }
}
