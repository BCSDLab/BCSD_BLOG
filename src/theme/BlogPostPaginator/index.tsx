import React, { ComponentProps } from 'react';
import BlogPostPaginator from '@theme-original/BlogPostPaginator';
import type BlogPostPaginatorType from '@theme/BlogPostPaginator';

import Utterance from '@site/src/components/Utterance';

type Props = ComponentProps<typeof BlogPostPaginatorType>;

export default function BlogPostPaginatorWrapper(props: Props) {
	return (
		<>
			<BlogPostPaginator {...props} />
			<Utterance />
		</>
	);
}
