// test-leetcode.js
const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const SLUG_QUERY = `
  query problemsetQuestionList($categorySlug: String, $skip: Int, $limit: Int, $filters: QuestionListFilterInput) {
    problemsetQuestionList: questionList(categorySlug: $categorySlug, skip: $skip, limit: $limit, filters: $filters) {
      questions: data {
        questionId
        titleSlug
        title
      }
    }
  }
`;

async function testFetch() {
  try {
    const res = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
      },
      body: JSON.stringify({
        query: SLUG_QUERY,
        variables: {
          categorySlug: "",
          skip: 0,
          limit: 1,
          filters: {},
        },
      }),
    });
    
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Data:", JSON.stringify(json, null, 2));
  } catch(e) {
    console.error("Error:", e);
  }
}

testFetch();
