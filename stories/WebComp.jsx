import register from '../src/index';

export const classnames = (...args) => (args.filter(Boolean).join(' '));

export function WebComp (props) {
	const {
		isWC,
		id: _id,
		className,
		value,
		onClick
	} = props;

	// eslint-disable-next-line no-console
	console.log(props);

	const id = isWC && _id ? `-wc-${_id}` : _id;

	return (
		<div id={id} className={classnames('click', className)}>
			<div className="value">{value}</div>
			<button onClick={onClick}>Click it</button>
		</div>
	);
}
WebComp.observedAttributes = [
	'value',
	'className'
];

register(WebComp, 'x-webcomp', undefined, { shadow: false });
