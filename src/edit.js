/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import {
	InspectorControls,
	BlockControls,
	RichText,
	BlockIcon,
	AlignmentToolbar,
	useBlockProps,
} from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';
import {
	Button,
	DropdownMenu,
	PanelBody,
	Placeholder,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
	ToolbarItem
} from '@wordpress/components';
import {
	alignLeft,
	alignRight,
	alignCenter,
	arrowUp,
	arrowDown,
	blockTable as icon,
	check,
	tableColumnAfter,
	tableColumnBefore,
	tableColumnDelete,
	tableRowAfter,
	tableRowBefore,
	tableRowDelete,
	table,
} from '@wordpress/icons';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import {
	createTable,
	updateSelectedCell,
	getCellAttribute,
	insertRow,
	deleteRow,
	moveRow,
	insertColumn,
	deleteColumn,
	toggleSection,
	isEmptyTableSection,
} from './state';

import './editor.scss';

const ALIGNMENT_CONTROLS = [
	{
		icon: alignLeft,
		title: __( 'Align column left' ),
		align: 'left',
	},
	{
		icon: alignCenter,
		title: __( 'Align column center' ),
		align: 'center',
	},
	{
		icon: alignRight,
		title: __( 'Align column right' ),
		align: 'right',
	},
];

const cellAriaLabel = {
	head: __( 'Header cell text' ),
	body: __( 'Body cell text' ),
};

const placeholder = {
	head: __( 'Header label' ),
};

function TSection( { name, ...props } ) {
	const TagName = `t${ name }`;
	return <TagName { ...props } />;
}

function TableEdit( {
											attributes,
											setAttributes,
											insertBlocksAfter,
											isSelected,
										} ) {
	const { hasFixedLayout, caption, head, body } = attributes;
	const [ initialRowCount, setInitialRowCount ] = useState( 2 );
	const [ initialColumnCount, setInitialColumnCount ] = useState( 2 );
	const [ selectedCell, setSelectedCell ] = useState();

	function onChangeInitialColumnCount( count ) {
		setInitialColumnCount( count );
	}

	function onChangeInitialRowCount( count ) {
		setInitialRowCount( count );
	}

	function onCreateTable( event ) {
		event.preventDefault();

		setAttributes(
			createTable( {
				rowCount: parseInt( initialRowCount, 10 ) || 2,
				columnCount: parseInt( initialColumnCount, 10 ) || 2,
			} )
		);
	}

	function onChangeFixedLayout() {
		setAttributes( { hasFixedLayout: ! hasFixedLayout } );
	}

	function onChange( content ) {
		if ( ! selectedCell ) {
			return;
		}

		setAttributes(
			updateSelectedCell(
				attributes,
				selectedCell,
				( cellAttributes ) => ( {
					...cellAttributes,
					content,
				} )
			)
		);
	}

	function insertCenteredDot() {
		if ( ! selectedCell ) {
			return;
		}

		setAttributes(
			updateSelectedCell(
				attributes,
				selectedCell,
				( cellAttributes ) => ( {
					...cellAttributes,
					content: '<span class="centered-dot"></span>',
				} )
			)
		);
	}

	function onChangeColumnAlignment( align ) {
		if ( ! selectedCell ) {
			return;
		}

		const columnSelection = {
			type: 'column',
			columnIndex: selectedCell.columnIndex,
		};

		const newAttributes = updateSelectedCell(
			attributes,
			columnSelection,
			( cellAttributes ) => ( {
				...cellAttributes,
				align,
			} )
		);
		setAttributes( newAttributes );
	}

	function getCellAlignment() {
		if ( ! selectedCell ) {
			return;
		}

		return getCellAttribute( attributes, selectedCell, 'align' );
	}

	function onToggleHeaderSection() {
		setAttributes( toggleSection( attributes, 'head' ) );
	}

	function onInsertRow( delta ) {
		if ( ! selectedCell ) {
			return;
		}

		const { sectionName, rowIndex } = selectedCell;
		const newRowIndex = rowIndex + delta;

		setAttributes(
			insertRow( attributes, {
				sectionName,
				rowIndex: newRowIndex,
			} )
		);
		setSelectedCell( {
			sectionName,
			rowIndex: newRowIndex,
			columnIndex: 0,
			type: 'cell',
		} );
	}

	function onInsertRowBefore() {
		onInsertRow( 0 );
	}

	function onInsertRowAfter() {
		onInsertRow( 1 );
	}

	function onDeleteRow() {
		if ( ! selectedCell ) {
			return;
		}

		const { sectionName, rowIndex } = selectedCell;

		setSelectedCell();
		setAttributes( deleteRow( attributes, { sectionName, rowIndex } ) );
	}

	function onInsertColumn( delta = 0 ) {
		if ( ! selectedCell ) {
			return;
		}

		const { columnIndex } = selectedCell;
		const newColumnIndex = columnIndex + delta;

		setAttributes(
			insertColumn( attributes, {
				columnIndex: newColumnIndex,
			} )
		);
		setSelectedCell( {
			rowIndex: 0,
			columnIndex: newColumnIndex,
			type: 'cell',
		} );
	}

	function onInsertColumnBefore() {
		onInsertColumn( 0 );
	}

	function onInsertColumnAfter() {
		onInsertColumn( 1 );
	}

	function onDeleteColumn() {
		if ( ! selectedCell ) {
			return;
		}

		const { sectionName, columnIndex } = selectedCell;

		setSelectedCell();
		setAttributes(
			deleteColumn( attributes, { sectionName, columnIndex } )
		);
	}

	function onMoveRow( delta = 0 ) {
		if ( ! selectedCell ) {
			return;
		}

		const { sectionName, rowIndex, columnIndex } = selectedCell;
		const newRowIndex = rowIndex + delta;

		setAttributes(
			moveRow( attributes, {
				sectionName,
				rowIndex: newRowIndex,
				newRowIndex: rowIndex,
			} )
		);
		setSelectedCell( {
			sectionName,
			rowIndex: newRowIndex,
			columnIndex: columnIndex,
			type: 'cell',
		} );
	}

	function onMoveRowUp() {
		onMoveRow( -1 );
	}

	function onMoveRowDown() {
		onMoveRow( 1 );
	}

	useEffect( () => {
		if ( ! isSelected ) {
			setSelectedCell();
		}
	}, [ isSelected ] );

	const sections = [ 'head', 'body' ].filter(
		( name ) => ! isEmptyTableSection( attributes[ name ] )
	);

	const tableControls = [
		{
			icon: tableRowBefore,
			title: __( 'Insert row before' ),
			isDisabled: ! selectedCell,
			onClick: onInsertRowBefore,
		},
		{
			icon: tableRowAfter,
			title: __( 'Insert row after' ),
			isDisabled: ! selectedCell,
			onClick: onInsertRowAfter,
		},
		{
			icon: tableRowDelete,
			title: __( 'Delete row' ),
			isDisabled: ! selectedCell,
			onClick: onDeleteRow,
		},
		{
			icon: tableColumnBefore,
			title: __( 'Insert column before' ),
			isDisabled: ! selectedCell,
			onClick: onInsertColumnBefore,
		},
		{
			icon: tableColumnAfter,
			title: __( 'Insert column after' ),
			isDisabled: ! selectedCell,
			onClick: onInsertColumnAfter,
		},
		{
			icon: tableColumnDelete,
			title: __( 'Delete column' ),
			isDisabled: ! selectedCell,
			onClick: onDeleteColumn,
		},
	];

	const renderedSections = [ 'head', 'body' ].map( ( name ) => (
		<TSection name={ name } key={ name }>
			{ attributes[ name ].map( ( { cells }, rowIndex ) => (
				<tr key={ rowIndex }>
					{ cells.map(
						(
							{ content, tag: CellTag, scope, align },
							columnIndex
						) => (
							<RichText
								tagName={ CellTag }
								key={ columnIndex }
								className={ classnames(
									{
										[ `has-text-align-${ align }` ]: align,
									},
									'wp-block-table__cell-content'
								) }
								scope={ CellTag === 'th' ? scope : undefined }
								value={ content }
								onChange={ onChange }
								unstableOnFocus={ () => {
									setSelectedCell( {
										sectionName: name,
										rowIndex,
										columnIndex,
										type: 'cell',
									} );
								} }
								aria-label={ cellAriaLabel[ name ] }
								placeholder={ placeholder[ name ] }
							/>
						)
					) }
				</tr>
			) ) }
		</TSection>
	) );

	const onChangeAlignment = ( newAlignment ) => {
		setAttributes( {
			alignment: newAlignment === undefined ? 'none' : newAlignment,
		} );
	};

	const isEmpty = ! sections.length;

	let isDisabledMoveRowUp = true;
	let isDisabledMoveRowDown = true;

	if( selectedCell ) {
		isDisabledMoveRowUp = selectedCell.rowIndex == 0;

		switch ( selectedCell.sectionName ) {
			case 'head':
				isDisabledMoveRowDown = selectedCell.rowIndex == head.length - 1

				break;
			case 'body':
				isDisabledMoveRowDown = selectedCell.rowIndex == body.length - 1

				break;
		}
	}

	return (
		<figure { ...useBlockProps() }>
			{ ! isEmpty && (
				<BlockControls>
					<ToolbarGroup>
						<ToolbarItem>
							{ ( toggleProps ) => (
								<DropdownMenu
									hasArrowIndicator
									icon={ table }
									toggleProps={ toggleProps }
									label={ __( 'Edit table' ) }
									controls={ tableControls }
								/>
							) }
						</ToolbarItem>
						<ToolbarButton
							icon={ arrowUp }
							label={ __( 'Move row up' ) }
							onClick={ onMoveRowUp }
							disabled={ isDisabledMoveRowUp }
						/>
						<ToolbarButton
							icon={ arrowDown }
							label={ __( 'Move row down' ) }
							onClick={ onMoveRowDown }
							disabled={ isDisabledMoveRowDown }
						/>
					</ToolbarGroup>
					<AlignmentToolbar
						label={ __( 'Change column alignment' ) }
						alignmentControls={ ALIGNMENT_CONTROLS }
						value={ getCellAlignment() }
						onChange={ ( nextAlign ) =>
							onChangeColumnAlignment( nextAlign )
						}
					/>
					<ToolbarGroup>
						<ToolbarButton
							icon={ check }
							label={ __( 'Insert centered dot' ) }
							onClick={ insertCenteredDot }
							disabled={ ! selectedCell }
						/>
					</ToolbarGroup>
				</BlockControls>
			) }
			{ ! isEmpty && (
				<InspectorControls>
					<PanelBody
						title={ __( 'Table settings' ) }
						className="blocks-table-settings"
					>
						<ToggleControl
							label={ __( 'Fixed width table cells' ) }
							checked={ !! hasFixedLayout }
							onChange={ onChangeFixedLayout }
						/>
						<ToggleControl
							label={ __( 'Header section' ) }
							checked={ !! ( head && head.length ) }
							onChange={ onToggleHeaderSection }
						/>
					</PanelBody>
				</InspectorControls>
			) }
			{ ! isEmpty && (
				<table
					className={ classnames(
						{ 'has-fixed-layout': hasFixedLayout }
					) }
				>
					{ renderedSections }
				</table>
			) }
			{ isEmpty && (
				<Placeholder
					label={ __( 'Table' ) }
					icon={ <BlockIcon icon={ icon } showColors /> }
					instructions={ __( 'Insert a table for sharing data.' ) }
				>
					<form
						className="blocks-custom-table__placeholder-form"
						onSubmit={ onCreateTable }
					>
						<TextControl
							type="number"
							label={ __( 'Column count' ) }
							value={ initialColumnCount }
							onChange={ onChangeInitialColumnCount }
							min="1"
							className="blocks-custom-table__placeholder-input"
						/>
						<TextControl
							type="number"
							label={ __( 'Row count' ) }
							value={ initialRowCount }
							onChange={ onChangeInitialRowCount }
							min="1"
							className="blocks-custom-table__placeholder-input"
						/>
						<Button
							className="blocks-custom-table__placeholder-button is-primary"
							variant="primary"
							type="submit"
						>
							{ __( 'Create Table' ) }
						</Button>
					</form>
				</Placeholder>
			) }
		</figure>
	);
}

export default TableEdit;
