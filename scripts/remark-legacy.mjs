import { visit } from 'unist-util-visit';

// Preserve existing Docusaurus callouts without rewriting contributors' posts.
export function legacyAdmonitions() {
  return (tree) => {
    visit(tree, 'containerDirective', (node) => {
      const names = {
        note: '참고',
        tip: '팁',
        info: '안내',
        warning: '주의',
        danger: '경고',
      };
      if (!(node.name in names)) return;
      const label = node.children[0]?.data?.directiveLabel
        ? node.children.shift()
        : undefined;
      const title = label?.children ?? [
        { type: 'text', value: names[node.name] },
      ];
      const kind = node.name;
      node.type = 'mdxJsxFlowElement';
      node.name = 'aside';
      node.attributes = [
        {
          type: 'mdxJsxAttribute',
          name: 'class',
          value: `callout callout-${kind}`,
        },
      ];
      node.children.unshift({
        type: 'mdxJsxFlowElement',
        name: 'strong',
        attributes: [],
        children: title,
      });
    });
  };
}
