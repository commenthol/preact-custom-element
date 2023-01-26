import { useEffect, useState, useRef } from 'preact/hooks';
import { WebComp } from './WebComp';

export const storyWcClassName = {
	title: 'className',
	component: () => {
		const ref = useRef(null);

		const [value, setValue] = useState(0);
		const handleClick = () => {
			setValue(value + 1);
		};

		useEffect(() => {
			const $el = document.getElementById('html');
			if (!$el) return;
			$el.setAttribute('value', value);
			$el?.addEventListener('click', handleClick);
			return () => {
				$el?.removeEventListener('click', handleClick);
			};
		}, [value]);

		return (
			<>
				<WebComp id="preact" className="test" value={value} onClick={handleClick} />
				<x-webcomp id="wc" className="test" value={value} onClick={handleClick}> </x-webcomp>
				<div ref={ref} />
			</>
		);
	}
};
