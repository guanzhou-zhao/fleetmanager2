// import {useState, useEffect, Fragment} from 'react'

const {useState, useEffect, Fragment} = React
function GreetingHeader({ user }) {
    let companyInHeader = ('company' in user) ? <span>from {user.company.name}</span> : ''
    return (
        <div>
            <span>Hi {user.name} </span>
            {companyInHeader}
        </div>
    );
}
function Instruction({ user }) {
    let instructions = [
        'Type in company code to join the company.',
        'Application of joining company has been sent. Please contact your boss to approve.',
        'type in vehicle registration number to start using the vehicle.'
    ]
    let instructionIndex = 0
    if ('company' in user) {
        // company.status 0: applying  1: approved
        instructionIndex = user.company.status + 1
    }
    return (
        <p>{instructions[instructionIndex]}</p>
    )
}
function TextInputControl({ user, companies, setUser }) {
    let [inputText, setInputText] = useState("")
    let [isWrongCompanyCode, setIsWrong] = useState(false)
    function handleClick() {
        // applying a company that exists
        if (companies.includes(inputText)) {
            setIsWrong(false)
            //apply to join the company
            axios.post('/joinCompany', { sub: user.sub, company: { name: inputText, status: 0 } })
                .then((res) => {
                    console.log('post /joinCompany')
                    console.log('response from POST /joinCompany :', res)
                    if (res.data && 'user' in res.data) {
                        // update user
                        setUser(res.data.user)
                    }
                }).catch((err) => {
                    console.log(err)
                })
        } else {// company doesn't exists
            setIsWrong(true)
        }
    }

    return (
        <div>
            <input
                type="text"
                value={inputText} placeholder="Company Code..."
                onChange={(e) => { setInputText(e.target.value) }} />
            <button onClick={handleClick}>Submit</button>
            {isWrongCompanyCode && <p>Company Code not found</p>}
        </div>
    )
}
function InstructionPage({ user: userProp, companies }) {
    let [user, setUser] = useState(userProp)
    return (
        <div>
            <GreetingHeader user={user} />
            <Instruction user={user} />
            {!('company' in user) && <TextInputControl user={user} companies={companies} setUser={setUser} />}
        </div>
    )
}
function BossPage() {

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await axios.get('/users'); // Replace with your API endpoint
                if ('error' in response.data) {
                    setError(response.data.error)
                } else {
                    setUsers(response.data);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []); // Empty dependency array means this runs once on mount

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Users</h1>
            <ul>
                {users.map(item => (
                    <li key={item.sub}>{item.name}</li> // Adjust according to your data structure
                ))}
            </ul>
        </div>
    );
}
function App({ data }) {
    let isBoss = data.user.isBoss
    let [showManagePage, setPage] = useState(isBoss)

    return (
        <Fragment>
            <button onClick={() => setPage(!showManagePage)}>{showManagePage ? 'as Driver' : 'Manage'}</button>
            {showManagePage ? <BossPage /> : <InstructionPage user={data.user} companies={data.companies} />}
        </Fragment>
    )
}
function renderRoot(data) {

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App data={data} />);
}