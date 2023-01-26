/* eslint-disable react/jsx-key */

import { render } from 'preact';
import Storybook from './Storybook';

import './WebComp';
import { 
	storyWcClassName
} from './WebComp.stories';

render(
	<Storybook stories={[
		<small>Components</small>,
		storyWcClassName
	]}
	/>,
	document.getElementById('app')
);
