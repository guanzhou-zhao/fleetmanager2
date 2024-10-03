// import {useState, useEffect, Fragment} from 'react'

const { useState, useEffect, Fragment } = React
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
function AddVehicle({ setIsAdding, vehicles, setVehicles }) {
    const [id, setId] = useState('')
    const [error, setError] = useState(null)
    function handleSubmit(e) {
        e.preventDefault();
        // You can handle form submission here, e.g., send data to an API or log it
        axios.post('/vehicle', { id: id })
            .then((res) => {
                if ('error' in res.data) {
                    setError(res.data.error)
                    setId('')
                } else {
                    vehicles.unshift(res.data)
                    setVehicles(vehicles)
                    setIsAdding(false)
                }
            })
            .catch((err) => {
                setError(err)
            })

        // Reset form after submission
        setId('')
        // setIsAdding(false)
    };
    function handleChange(e) {
        setId(e.target.value.toUpperCase());
        if (vehicles.map(v => v.name.toUpperCase()).includes(e.target.value.toUpperCase())) { setError('number has been used') }
        else { setError(null) }
    }
    return <div>
        <button onClick={() => setIsAdding(false)}>Cancel</button>
        <form onSubmit={handleSubmit}>
            <div>
                <label>Registration Number:</label>
                <input
                    type="text"
                    name="id"
                    value={id}
                    onChange={handleChange}
                    required
                />{error && <div>number used!</div>}
            </div>
            <button type="submit" disabled={vehicles.map(v => v.name.toUpperCase()).includes(id)}>Submit</button>
        </form>
    </div>
}
function EditVehicle({ vehicle, setIsEditting }) {
    function handleSave() {
        setIsEditting(false)
    }

    const [formData, setFormData] = useState({ odometer: 0, hubo: 0, ruc: 0, rego: '2000-01-01', cof: '2000-01-01', service: 0, location: '', ...vehicle });
    useEffect(() => {
        console.log('New state:', formData); // Logs new state after re-render
    }, [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // You can handle form submission here, e.g., send data to an API or log it
        console.log('Form submitted:', formData);
        // Reset form after submission
        setFormData({});
    };
    return <form onSubmit={handleSubmit}>
        <h3>Editting <button onClick={handleSave}>Save</button></h3>
        <div>
            <label>Plate:</label>
            <input
                type="text"
                name="name"
                value={formData.name}
                disabled
            />
        </div>
        <div>
            <label>Odometer:</label>
            <input
                type="number"
                name="odometer"
                value={formData.odometer}
                onChange={handleChange}
                required
            />
        </div>
        <div>
            <label>Hubdometer:</label>
            <input
                type="number"
                name="hubo"
                value={formData.hubo}
                onChange={handleChange}
                required
            />
        </div>
        <div>
            <label>RUC:</label>
            <input
                type="number"
                name="ruc"
                value={formData.ruc}
                onChange={handleChange}
                required
            />
        </div>
        <div>
            <label>Rego:</label>
            <input
                type="date"
                name="rego"
                value={formData.rego}
                onChange={handleChange}
                required
            />
        </div>
        <div>
            <label>Cof:</label>
            <input
                type="date"
                name="cof"
                value={formData.cof}
                onChange={handleChange}
                required
            />
        </div>
        <div>
            <label>Next Service:</label>
            <input
                type="number"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
            />
        </div>
        <div>
            <label>Location:</label>
            <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
            />
        </div>
        <button type="submit">Submit</button>
    </form>
}
function ListVehicle({ vehicles, setVehicleIsEditing, setIsEditting }) {
    function handleEdit(vehicle) {
        setIsEditting(true)
        setVehicleIsEditing(vehicle)
    }
    return <div><h2>Vehicle List</h2>
        {vehicles.length === 0 ? (
            <p>No vehicles added yet.</p>
        ) : (
            <ul>
                {vehicles.map((vehicle) => (
                    <li key={vehicle.name}>
                        {vehicle.name}
                        <button onClick={() => {
                            setIsEditting(true);
                            setVehicleIsEditing(vehicle)
                        }}>Edit</button>
                    </li>
                ))}
            </ul>
        )}</div>
}
function Vehicles() {
    const [isEditting, setIsEditting] = useState(false)
    const [vehicleIsEditing, setVehicleIsEditing] = useState({})
    const [isAdding, setIsAdding] = useState(false)
    const [vehicles, setVehicles] = useState([])
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await axios.get('/vehicles'); // Replace with your API endpoint
                if ('error' in response.data) {
                    setError(response.data.error)
                } else {
                    setVehicles(response.data);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchVehicles();
    }, []); // Empty dependency array means this runs once on mount
    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;
    if (isEditting) return <EditVehicle vehicle={vehicleIsEditing} setIsEditting={setIsEditting} />
    return (
        <div>
            {!isAdding && <button onClick={() => setIsAdding(true)}>Add Vehicle</button>}
            {isAdding && <AddVehicle setIsAdding={setIsAdding} vehicles={vehicles} setVehicles={setVehicles} />}
            <ListVehicle {...{ vehicles, setVehicleIsEditing, setIsEditting }} />
        </div>
    )
}
function BossPage() {

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activePage, setActivePage] = useState('vehicles')

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

    function toggleApprove(item) {
        return function () {
            console.log(item)
            axios.post('/setJoinCompanyStatus', { sub: item.sub, data: { company: { status: item.company.status == 0 ? 1 : 0 } } })
                .then((res) => {
                    if ('error' in res.data) {
                        setError(res.data.error)
                    } else {
                        const resUser = res.data.user
                        const newUsers = users.map((u) => u.sub == resUser.sub ? resUser : u)
                        console.log(newUsers)
                        setUsers(newUsers)
                    }
                })
                .catch((err) => {
                    setError(err)
                })
        }
    }
    return (
        <div>
            <h4 onClick={() => setActivePage('users')}>Users</h4>
            <h4 onClick={() => setActivePage('vehicles')}>Vehicles</h4>
            {activePage == 'users' && <ul>
                {users.map(item => (
                    <li key={item.sub}>{item.name} {item.email} <button onClick={toggleApprove(item)}>{item.company.status == 0 ? 'approve' : 'remove'}</button></li> // Adjust according to your data structure
                ))}
            </ul>}
            {activePage == 'vehicles' && (
                <Vehicles />
            )}
        </div>
    );
}
function App({ data }) {
    let isBoss = data.user.isBoss
    let [showManagePage, setPage] = useState(isBoss)

    return (
        <Fragment>
            <button onClick={() => setPage(!showManagePage)}>{showManagePage ? 'login as Driver' : 'Manage fleet'}</button>
            {showManagePage ? <BossPage /> : <InstructionPage user={data.user} companies={data.companies} />}
        </Fragment>
    )
}
function renderRoot(data) {

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App data={data} />);
}