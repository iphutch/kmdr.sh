import emoji from "node-emoji";
import AST from "../ast";
import Decorator from "../highlight/decorator";
import Highlight from "../highlight/highlight";
import {
  ArgumentNodeAST,
  AssignmentNodeAST,
  ConsoleAnswers,
  ExplainCommandResponse,
  OperatorNodeAST,
  OptionNodeAST,
  PipeNodeAST,
  ProgramNodeAST,
  StickyOptionNodeAST,
  SubcommandNodeAST,
  SudoNodeAST,
} from "../interfaces";
import Console from "./console";

const explanationEmoji = emoji.get("bulb");

class ExplainConsole extends Console {
  private questions: Object[] = [
    {
      message: "Explain a command:",
      name: "query",
      prefix: `${explanationEmoji}`,
      type: "input",
    },
  ];

  constructor() {
    super();
  }

  public makeHelp(
    leafNodes: Array<
      Array<
        | OptionNodeAST
        | ProgramNodeAST
        | AssignmentNodeAST
        | SubcommandNodeAST
        | OperatorNodeAST
        | PipeNodeAST
        | StickyOptionNodeAST
      >
    >,
  ): string {
    let help = "";
    for (const unit of leafNodes) {
      for (const node of unit) {
        if (AST.isProgram(node)) {
          const programNode = <ProgramNodeAST>node;
          const { summary, name } = programNode.schema;
          const decoratedProgramName = Decorator.decorate(name, programNode);

          help += `  ${decoratedProgramName}: ${summary}\n`;
        }

        if (AST.isOption(node)) {
          const optionNode = node as OptionNodeAST;
          const { summary, long, short } = optionNode.optionSchema;
          const decoratedOptions = [];

          if (short && short.length >= 1) {
            decoratedOptions.push(Decorator.decorate(short.join(", "), optionNode));
          }

          if (long && long.length >= 1) {
            decoratedOptions.push(Decorator.decorate(long.join(", "), optionNode));
          }

          help += `  ${decoratedOptions.join(", ")}: ${summary}\n`;
        }

        if (AST.isSubcommand(node)) {
          const subcommandNode = <SubcommandNodeAST>node;
          const { name, summary } = subcommandNode.schema;
          const decoratedSubcommandName = Decorator.decorate(name, subcommandNode);

          help += `  ${decoratedSubcommandName}: ${summary}\n`;
        }

        if (AST.isAssignment(node)) {
          const assignmentNode = node as AssignmentNodeAST;
          const { word } = assignmentNode;
          const decoratedAssignment = Decorator.decorate(word, assignmentNode);

          help += `  ${decoratedAssignment}: A variable passed to the program process\n`;
        }

        if (AST.isOperator(node)) {
          const operatorNode = <OperatorNodeAST>node;
          const { op } = operatorNode;
          const decoratedOperator = Decorator.decorate(op, operatorNode);

          help += `${decoratedOperator} - `;
          if (op === "&&") {
            help += `  command2 is executed if, and only if, command1 returns an exit status of zero\n`;
          } else if (op === "||") {
            help += `  command2  is  executed  if and only if command1 returns a non-zero exit status\n`;
          }
        }

        if (AST.isSudo(node)) {
          const sudoNode = node as SudoNodeAST;
          const { summary } = sudoNode.schema;
          const decoratedNode = Decorator.decorate("sudo", sudoNode);
          help += `  ${decoratedNode}: ${summary}`;
        }

        if (AST.isArgument(node)) {
          const argNode = node as ArgumentNodeAST;
          const { word } = argNode;
          const decoratedNode = Decorator.decorate(word, argNode);
          help += `  ${decoratedNode}: an argument\n`;
        }

        if (AST.isPipe(node)) {
          const pipeNode = node as PipeNodeAST;
          const { pipe } = pipeNode;
          const decoratedNode = Decorator.decorate(pipe, pipeNode);
          help += `  ${decoratedNode}: A pipe connects the STDOUT of the first process to the STDIN of the second\n`;
        }
      }
    }

    return help;
  }

  public async prompt(): Promise<ConsoleAnswers> {
    return super.prompt(this.questions);
  }

  public makeSamples() {
    //
  }

  public error(msg: string) {
    super.error(msg);
  }

  public render(data: ExplainCommandResponse) {
    const { query, leafNodes } = data.explainCommand;

    this.print();
    if (leafNodes) {
      const highlight = new Highlight();
      const decoratedQuery = highlight.decorate(query, leafNodes);
      // const boxedContent = this.box(decoratedQuery);

      // add a new line
      this.print(`  ${decoratedQuery}`);

      const help = this.makeHelp(leafNodes);

      this.print();

      this.print(help);
    } else {
      this.error("No result");
    }
    this.print();
  }
}

export default ExplainConsole;
