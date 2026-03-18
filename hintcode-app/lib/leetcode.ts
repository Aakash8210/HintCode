import DOMPurify from "dompurify";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

const PROBLEM_QUERY = `
  query getProblem($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      titleSlug
      content
      difficulty
      topicTags { name }
      codeSnippets { lang langSlug code }
      exampleTestcases
      acRate
      stats
    }
  }
`;

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

export async function fetchProblemBySlug(slug: string) {
  const res = await fetch(LEETCODE_GRAPHQL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Referer: "https://leetcode.com",
    },
    body: JSON.stringify({
      query: PROBLEM_QUERY,
      variables: { titleSlug: slug },
    }),
  });

  if (!res.ok) throw new Error(`LeetCode API error: ${res.status}`);
  const data = await res.json();

  if (!data?.data?.question) {
    throw new Error("Problem not found");
  }

  return data.data.question;
}

export async function fetchProblemByNumber(num: number) {
  // Search for the problem to get its slug
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
        skip: num - 1,
        limit: 1,
        filters: {},
      },
    }),
  });

  if (!res.ok) throw new Error(`LeetCode API error: ${res.status}`);
  const data = await res.json();
  const questions = data?.data?.problemsetQuestionList?.questions;

  if (!questions || questions.length === 0) {
    throw new Error("Problem not found");
  }

  // The list is sorted by ID, verify we got the right one
  const found = questions.find(
    (q: { questionId: string }) => String(q.questionId) === String(num)
  );
  
  if (found) {
    return fetchProblemBySlug(found.titleSlug);
  }

  // Fallback: try direct slug construction for common problems
  // e.g., number 1 = "two-sum"
  throw new Error("Problem not found");
}

export function parseProblemContent(html: string): string {
  if (typeof window === "undefined") {
    // Server-side: basic sanitization
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "");
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "ul", "ol", "li",
      "code", "pre", "sup", "sub", "img",
      "div", "span", "h1", "h2", "h3", "h4",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["class", "style", "src", "alt", "href"],
  });
}

export function parseExampleTestcasesFromHTML(html: string): { input: string; output: string }[] {
  if (!html) return [];
  const results: { input: string; output: string }[] = [];
  
  // Strip HTML tags to get raw text
  const cleanText = html.replace(/<[^>]+>/g, " ");
  
  // Regex to match Input: ... Output: ... Optional(Explanation: ...)
  // Not using /s flag for ES5 compatibility, using [\s\S] instead of .
  const regex = /Input:\s*([\s\S]*?)\s*Output:\s*([\s\S]*?)(?=\s*Explanation:|\s*Example \d+:|\s*Constraints:|$)/g;
  
  let match;
  while ((match = regex.exec(cleanText)) !== null) {
    results.push({
      input: match[1].trim(),
      output: match[2].trim(),
    });
  }

  return results;
}
