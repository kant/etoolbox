import React from 'react';
import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import withWidth, { isWidthUp } from '@material-ui/core/withWidth';
import { Breakpoint } from '@material-ui/core/styles/createBreakpoints';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import AssignmentTurnedIn from '@material-ui/icons/AssignmentTurnedIn';
import TextRotationNoneIcon from '@material-ui/icons/TextRotationNone';
import TextField from '@material-ui/core/TextField';
import * as copy from 'copy-to-clipboard';
import ReactHtmlParser from 'react-html-parser';
import { useDebouncedCallback } from 'use-debounce';

import { setTextAction } from '../../actions/text-actions';
import { AppState } from '../../reducers';
import * as services from './services';
import { Box, Toolbar } from '@material-ui/core';
import FeatureTitle from '../../components/FeatureTitle';
import { useToasterUpdate } from '../../components/Toaster/ToasterProvider';

const useStyles = makeStyles((theme) => ({
    root: {
        margin: theme.spacing(1),
    },
    formatted: {
        padding: theme.spacing(1),
        border: '1px solid grey',
        '& span': {
            backgroundColor: 'yellow',
            fontWeight: 'bold',
        }
    },
    toolbar: {
        margin: 0,
        padding: 0,
        '& > *': {
            marginLeft: theme.spacing(1),
        },
    },
}));

interface Props {
    width: Breakpoint;
    inputText?: string;
    regularExpression?: string;
    storeInputText: (name: string, value: string) => void;
}

const RegExTester: React.FC<Props> = (props: Props) => {
    const classes = useStyles();
    const { setToasterState } = useToasterUpdate();
    const { regularExpression, inputText, storeInputText } = props;
    const [transformed, setTransformed] = React.useState('');
    const [extracted, setExtracted] = React.useState('');

    // https://www.npmjs.com/package/use-debounce
    const debounced = useDebouncedCallback(
        (regularExpression, inputText) => {
            setTransformed(services.transform(regularExpression, inputText));
            setExtracted(services.extract(regularExpression, inputText));
        },
        300
    );

    const handleCopy = (event: any, data: string | undefined) => {
        event.preventDefault();
        if (data) {
            copy.default(data, { format: 'text/plain' });
            setToasterState({ open: true, message: 'Content copied into clipboard', type: 'success', autoHideDuration: 2000 });
        }
    }

    React.useEffect(
        // https://www.npmjs.com/package/use-debounce
        () => debounced.callback(regularExpression, inputText),
        [regularExpression, inputText, debounced]
    );

    return (
        <div className={classes.root}>
            <FeatureTitle iconType={TextRotationNoneIcon} title="Regular expressions tester" />

            <form noValidate autoComplete="off">
                <div>
                    <TextField
                        autoFocus={isWidthUp('md', props.width)}
                        id="regex"
                        label="Regular expression"
                        placeholder="Type the regular expression. Example: /example/g"
                        variant="outlined"
                        margin="normal"
                        fullWidth={true}
                        value={regularExpression}
                        onChange={(e) => storeInputText('lastRegEx', e.target.value)}
                    />
                    <TextField
                        id="content"
                        label="Content to test the regular expression against"
                        placeholder="Paste or type the content here"
                        multiline
                        rows={6}
                        variant="outlined"
                        margin="normal"
                        fullWidth={true}
                        value={inputText}
                        onChange={(e) => storeInputText('lastRegExTextSample', e.target.value)}
                    />
                </div>
            </form>

            <Toolbar className={classes.toolbar}>
                <Box display='flex' flexGrow={1}></Box>
                <Button endIcon={<AssignmentTurnedIn>Copy</AssignmentTurnedIn>}
                    variant="contained" color="primary" onClick={(e) => handleCopy(e, regularExpression)}>Copy</Button>
            </Toolbar>

            <div className={classes.formatted}>
                {ReactHtmlParser(transformed)}
            </div>

            <p>
                Collection of values. Could be usefull for Jira tickets numbers with expressions like:
                <strong>issueKey in (FS-3456, WS-3213, FS-9988)</strong>
            </p>
            <div className={classes.formatted}>
                {extracted}
            </div>
            <Toolbar className={classes.toolbar}>
                <Box display='flex' flexGrow={1}></Box>
                <Button endIcon={<AssignmentTurnedIn>Copy</AssignmentTurnedIn>}
                    variant="contained" color="primary" onClick={(e) => handleCopy(e, extracted)}>Copy</Button>
            </Toolbar>

        </div>
    );
}

export function mapStateToProps(state: AppState) {
    return {
        regularExpression: state.textInputs.map.get('lastRegEx'),
        inputText: state.textInputs.map.get('lastRegExTextSample'),
    }
}

export function mapDispatchToProps(dispatch: Dispatch) {
    return {
        storeInputText: (name: string, value: string) => dispatch(setTextAction(name, value)),
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(withWidth()(RegExTester));
