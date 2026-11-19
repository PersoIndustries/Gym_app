export const pageHead = (title: string, description: string) => () => ({
  meta: [{ title: `${title} — BoxFlow` }, { name: "description", content: description }, { property: "og:title", content: `${title} — BoxFlow` }, { property: "og:description", content: description }],
});
