var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

// import {useState} from 'react'
var _React = React,
    useState = _React.useState;

function GreetingHeader(_ref) {
    var user = _ref.user;

    console.log('<GreetingHeader> ', user);
    var companyInHeader = 'company' in user ? React.createElement(
        'span',
        null,
        'from ',
        user.company.name
    ) : '';
    return React.createElement(
        'div',
        null,
        React.createElement(
            'span',
            null,
            'Hi ',
            user.name
        ),
        companyInHeader
    );
}
function Instruction(_ref2) {
    var user = _ref2.user;

    var instructions = ['Type in company code to join the company.', 'Application of joining company has been sent. Please contact your boss to approve.', 'type in vehicle registration number to start using the vehicle.'];
    var instructionIndex = 0;
    if ('company' in user) {
        // company.status 0: applying  1: approved
        instructionIndex = user.company.status + 1;
    }
    return React.createElement(
        'p',
        null,
        instructions[instructionIndex]
    );
}
function TextInputControl(_ref3) {
    var user = _ref3.user,
        companies = _ref3.companies;

    var _useState = useState(""),
        _useState2 = _slicedToArray(_useState, 2),
        inputText = _useState2[0],
        setInputText = _useState2[1];

    var _useState3 = useState(false),
        _useState4 = _slicedToArray(_useState3, 2),
        isWrongCompanyCode = _useState4[0],
        setIsWrong = _useState4[1];

    function handleClick() {
        // applying a company that exists
        if (companies.includes(inputText)) {
            setIsWrong(false);
            //apply to join the company
            axios.post('/joinCompany', { sub: user.sub, company: { name: inputText, status: 0 } }).then(function (res) {
                console.log('post /joinCompany');
                console.log('response from POST /joinCompany :', res);
                if (res.data && 'error' in res.data) {} else {}
            }).catch(function (err) {
                console.log(err);
            });
        } else {
            // company doesn't exists
            setIsWrong(true);
        }
    }

    return React.createElement(
        'div',
        null,
        React.createElement('input', {
            type: 'text',
            value: inputText, placeholder: 'Company Code...',
            onChange: function onChange(e) {
                setInputText(e.target.value);
            } }),
        React.createElement(
            'button',
            { onClick: handleClick },
            'Submit'
        ),
        isWrongCompanyCode && React.createElement(
            'p',
            null,
            'Company Code not found'
        )
    );
}
function InstructionPage(_ref4) {
    var user = _ref4.user,
        companies = _ref4.companies;

    console.log('InstructionPage user : ', user);
    return React.createElement(
        'div',
        null,
        React.createElement(GreetingHeader, { user: user }),
        React.createElement(Instruction, { user: user }),
        React.createElement(TextInputControl, { user: user, companies: companies })
    );
}

function renderRoot(data) {

    var root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(InstructionPage, { user: data.user, companies: data.companies }));
}