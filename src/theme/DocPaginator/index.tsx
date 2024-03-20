import React, { ComponentProps } from 'react';
import DocPaginator from '@theme-original/DocPaginator';
import type DocPaginatorType from '@theme/DocPaginator';

import Utterance from '@site/src/components/Utterance';

type Props = ComponentProps<typeof DocPaginatorType>;

export default function DocPaginatorWrapper(props: Props) {
	return (
		<>
			<DocPaginator {...props} />
			<Utterance />
		</>
	);
}
