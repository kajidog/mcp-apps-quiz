import { graphql } from "@/gql";
import type { GraphqlExecutor, McpCaller } from "@/shared/api";
import type { CreateQuizInput, Quiz } from "@quiz/core";
import "@/shared/api/graphql/fragments.js";

export interface EditPatch {
  title?: string;
  tags?: string[];
  favorite?: boolean;
  questions?: CreateQuizInput["questions"];
}

/** クイズの作成・編集に関するデータアクセス。 */
export interface EditorApi {
  createQuiz(input: CreateQuizInput): Promise<Quiz>;
  editQuiz(quizId: string, patch: EditPatch): Promise<Quiz | null>;
}

const CreateQuizDoc = graphql(`
  mutation CreateQuiz($input: CreateQuizInput!) { createQuiz(input: $input) { ...QuizFields } }
`);
const EditQuizDoc = graphql(`
  mutation EditQuiz($quizId: ID!, $patch: EditQuizPatch!) {
    editQuiz(quizId: $quizId, patch: $patch) { ...QuizFields }
  }
`);

export function createMcpEditorApi(caller: McpCaller): EditorApi {
  return {
    async createQuiz(input) {
      const r = await caller.structured<{ quiz: Quiz }>("quiz_create", { ...input });
      return r.quiz;
    },
    editQuiz: (quizId, patch) => caller.field<Quiz>("quiz_edit", { quizId, patch }, "quiz"),
  };
}

export function createGraphqlEditorApi(execute: GraphqlExecutor): EditorApi {
  return {
    async createQuiz(input) {
      const d = await execute(CreateQuizDoc, { input });
      return d.createQuiz as Quiz;
    },
    async editQuiz(quizId, patch) {
      const d = await execute(EditQuizDoc, { quizId, patch });
      return (d.editQuiz ?? null) as Quiz | null;
    },
  };
}
