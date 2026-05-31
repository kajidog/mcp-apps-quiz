import { graphql } from "@/gql";

/**
 * Quiz 全体を取得する共有 GraphQL フラグメント。
 * 各 feature の operation から `...QuizFields` で参照する（codegen が各 operation の
 * DocumentNode にこのフラグメント定義を埋め込むため、定義場所は問わない）。
 */
export const QuizFields = graphql(`
  fragment QuizFields on Quiz {
    id title tags favorite createdAt updatedAt
    questions { id order text explanation choices { id order text isCorrect } }
  }
`);

// codegen にフラグメント定義として確実に拾わせるための副作用参照。
void QuizFields;
