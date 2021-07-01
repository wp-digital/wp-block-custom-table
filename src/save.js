/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	RichText,
	useBlockProps,
} from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { hasFixedLayout, head, body, caption } = attributes;
	const isEmpty = ! head.length && ! body.length;

	if ( isEmpty ) {
		return null;
	}

	const classes = classnames( {
		'has-fixed-layout': hasFixedLayout,
	} );

	const hasCaption = ! RichText.isEmpty( caption );

	const Section = ( { type, rows } ) => {
		if ( ! rows.length ) {
			return null;
		}

		const Tag = `t${ type }`;

		return (
			<Tag>
				{ rows.map( ( { cells }, rowIndex ) => (
					<tr key={ rowIndex }>
						{ cells.map(
							( { content, tag, scope, align }, cellIndex ) => {
								const cellClasses = classnames( {
									[ `has-text-align-${ align }` ]: align,
								} );

								return (
									<RichText.Content
										className={
											cellClasses
												? cellClasses
												: undefined
										}
										data-align={ align }
										tagName={ tag }
										value={ content }
										key={ cellIndex }
										scope={
											tag === 'th' ? scope : undefined
										}
									/>
								);
							}
						) }
					</tr>
				) ) }
			</Tag>
		);
	};

	return (
		<figure { ...useBlockProps.save() }>
			<table
				className={ classes === '' ? undefined : classes }
			>
				<Section type="head" rows={ head } />
				<Section type="body" rows={ body } />
			</table>
			{ hasCaption && (
				<RichText.Content tagName="figcaption" value={ caption } />
			) }
		</figure>
	);
}
