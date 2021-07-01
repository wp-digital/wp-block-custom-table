/**
 * External dependencies
 */
import { times, get, mapValues, every, pick } from 'lodash';

const INHERITED_COLUMN_ATTRIBUTES = [ 'align' ];

export function createTable( { rowCount, columnCount } ) {
	return {
		body: times( rowCount, () => ( {
			cells: times( columnCount, () => ( {
				content: '',
				tag: 'td',
			} ) ),
		} ) ),
	};
}

export function getFirstRow( state ) {
	if ( ! isEmptyTableSection( state.head ) ) {
		return state.head[ 0 ];
	}
	if ( ! isEmptyTableSection( state.body ) ) {
		return state.body[ 0 ];
	}
}

export function getCellAttribute( state, cellLocation, attributeName ) {
	const { sectionName, rowIndex, columnIndex } = cellLocation;
	return get( state, [
		sectionName,
		rowIndex,
		'cells',
		columnIndex,
		attributeName,
	] );
}

export function updateSelectedCell( state, selection, updateCell ) {
	if ( ! selection ) {
		return state;
	}

	const tableSections = pick( state, [ 'head', 'body' ] );
	const {
		sectionName: selectionSectionName,
		rowIndex: selectionRowIndex,
	} = selection;

	return mapValues( tableSections, ( section, sectionName ) => {
		if ( selectionSectionName && selectionSectionName !== sectionName ) {
			return section;
		}

		return section.map( ( row, rowIndex ) => {
			if ( selectionRowIndex && selectionRowIndex !== rowIndex ) {
				return row;
			}

			return {
				cells: row.cells.map( ( cellAttributes, columnIndex ) => {
					const cellLocation = {
						sectionName,
						columnIndex,
						rowIndex,
					};

					if ( ! isCellSelected( cellLocation, selection ) ) {
						return cellAttributes;
					}

					return updateCell( cellAttributes );
				} ),
			};
		} );
	} );
}

export function isCellSelected( cellLocation, selection ) {
	if ( ! cellLocation || ! selection ) {
		return false;
	}

	switch ( selection.type ) {
		case 'column':
			return (
				selection.type === 'column' &&
				cellLocation.columnIndex === selection.columnIndex
			);
		case 'cell':
			return (
				selection.type === 'cell' &&
				cellLocation.sectionName === selection.sectionName &&
				cellLocation.columnIndex === selection.columnIndex &&
				cellLocation.rowIndex === selection.rowIndex
			);
	}
}

export function insertRow( state, { sectionName, rowIndex, columnCount } ) {
	const firstRow = getFirstRow( state );
	const cellCount =
		columnCount === undefined
			? get( firstRow, [ 'cells', 'length' ] )
			: columnCount;

	if ( ! cellCount ) {
		return state;
	}

	return {
		[ sectionName ]: [
			...state[ sectionName ].slice( 0, rowIndex ),
			{
				cells: times( cellCount, ( index ) => {
					const firstCellInColumn = get(
						firstRow,
						[ 'cells', index ],
						{}
					);
					const inheritedAttributes = pick(
						firstCellInColumn,
						INHERITED_COLUMN_ATTRIBUTES
					);

					return {
						...inheritedAttributes,
						content: '',
						tag: sectionName === 'head' ? 'th' : 'td',
					};
				} ),
			},
			...state[ sectionName ].slice( rowIndex ),
		],
	};
}

export function moveRow( state, { sectionName, rowIndex, newRowIndex } ) {
	const firstRow = getFirstRow( state );
	const cellCount = get( firstRow, [ 'cells', 'length' ] );

	if ( ! cellCount ) {
		return state;
	}

	let min = Math.min( rowIndex, newRowIndex );
	let max = Math.max( rowIndex, newRowIndex );

	return {
		[ sectionName ]: [
			...state[ sectionName ].slice( 0, min ),
			rowIndex > newRowIndex ? state[ sectionName ][ rowIndex ] : state[ sectionName ][ newRowIndex ],
			rowIndex < newRowIndex ? state[ sectionName ][ rowIndex ] : state[ sectionName ][ newRowIndex ],
			...state[ sectionName ].slice( max + 1 ),
		],
	};
}

export function deleteRow( state, { sectionName, rowIndex } ) {
	return {
		[ sectionName ]: state[ sectionName ].filter(
			( row, index ) => index !== rowIndex
		),
	};
}

export function insertColumn( state, { columnIndex } ) {
	const tableSections = pick( state, [ 'head', 'body' ] );

	return mapValues( tableSections, ( section, sectionName ) => {
		if ( isEmptyTableSection( section ) ) {
			return section;
		}

		return section.map( ( row ) => {
			if ( isEmptyRow( row ) || row.cells.length < columnIndex ) {
				return row;
			}

			return {
				cells: [
					...row.cells.slice( 0, columnIndex ),
					{
						content: '',
						tag: sectionName === 'head' ? 'th' : 'td',
					},
					...row.cells.slice( columnIndex ),
				],
			};
		} );
	} );
}

export function deleteColumn( state, { columnIndex } ) {
	const tableSections = pick( state, [ 'head', 'body' ] );

	return mapValues( tableSections, ( section ) => {
		if ( isEmptyTableSection( section ) ) {
			return section;
		}

		return section
			.map( ( row ) => ( {
				cells:
					row.cells.length >= columnIndex
						? row.cells.filter(
						( cell, index ) => index !== columnIndex
						)
						: row.cells,
			} ) )
			.filter( ( row ) => row.cells.length );
	} );
}

export function toggleSection( state, sectionName ) {
	if ( ! isEmptyTableSection( state[ sectionName ] ) ) {
		return { [ sectionName ]: [] };
	}

	const columnCount = get( state, [ 'body', 0, 'cells', 'length' ], 1 );

	return insertRow( state, { sectionName, rowIndex: 0, columnCount } );
}

export function isEmptyTableSection( section ) {
	return ! section || ! section.length || every( section, isEmptyRow );
}

export function isEmptyRow( row ) {
	return ! ( row.cells && row.cells.length );
}
