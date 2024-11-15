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
        'Enter company code to join the company.',
        'Application of joining company has been sent. Please contact your boss to approve.',
        'Enter vehicle registration number to start using the vehicle.'
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
function AddVehicle({ vehicles, setVehicles }) {
    const [id, setId] = useState('')
    const [error, setError] = useState(null)
    const [isAdding, setIsAdding] = useState(false)
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
    if (!isAdding) return <div className="m-2">
        <button className="bg-blue-400 py-2 px-3 rounded text-white" onClick={() => setIsAdding(true)}>Add Vehicle</button>
    </div>
    if (isAdding) return <div className="relative m-2 p-3 bg-blue-400 text-white">
        <button className="absolute top-0 right-0 bg-red-600 px-2 rounded" onClick={() => setIsAdding(false)}>Cancel</button>
        <form onSubmit={handleSubmit}>
            <div className="flex flex-col">
                <label>Registration Number:</label>
                <input className="input"
                    type="text"
                    name="id"
                    value={id}
                    onChange={handleChange}
                    required
                />{error && <div>number used!</div>}
            </div>
            <button className="mt-4 bg-green-600 p-2 rounded" type="submit" disabled={vehicles.map(v => v.name.toUpperCase()).includes(id)}>Submit</button>
        </form>
    </div>
}
function EditVehicle({ vehicle, setIsEditting, vehicles, setVehicles }) {

    const [formData, setFormData] = useState({ odometer: 0, hubo: 0, ruc: 0, rego: '2000-01-01', cof: '2000-01-01', service: 0, location: '', ...vehicle });
    const [error, setError] = useState(null)

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };
    const handleCancel = (e) => {
        setIsEditting(false)
        setFormData({})
        setError(null)
    }
    const handleSubmit = (e) => {
        e.preventDefault();
        // You can handle form submission here, e.g., send data to an API or log it
        let v = { ...formData }
        delete v.company
        delete v.name
        axios.put('/vehicle', { id: vehicle.name, vehicle: v }).then((res) => {
            if ('error' in res.data) {
                // setError(res.data.error)
            } else {
                setVehicles(vehicles.map((v) => {
                    if (v.name == res.data.name) {
                        return res.data
                    } else {
                        return v
                    }
                }))
                setIsEditting(false)
                // Reset form after submission
                setFormData({});
            }
        }).catch((err) => {
            setError(err.message)
        })
    };
    return <form onSubmit={handleSubmit} className="relative m-2 p-3 bg-blue-400 text-white">
        <h3>Editting <button className="absolute top-0 right-0 bg-red-600 px-2 rounded" onClick={handleCancel}>Cancel</button></h3>
        {error && <div>{error}</div>}
        <div className="flex flex-col">
            <label>Plate:</label>
            <input className="input"
                type="text"
                name="name"
                value={formData.name}
                disabled
            />
        </div>
        <div className="flex flex-col">
            <label>Odometer:</label>
            <input className="input"
                type="number"
                name="odometer"
                value={formData.odometer}
                onChange={handleChange}
                required
            />
        </div>
        <div className="flex flex-col">
            <label>Next Service:</label>
            <input className="input"
                type="number"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
            />
        </div>
        <div className="flex flex-col">
            <label>Hubdometer:</label>
            <input className="input"
                type="number"
                name="hubo"
                value={formData.hubo}
                onChange={handleChange}
                required
            />
        </div>
        <div className="flex flex-col">
            <label>RUC:</label>
            <input className="input"
                type="number"
                name="ruc"
                value={formData.ruc}
                onChange={handleChange}
                required
            />
        </div>
        <div className="flex flex-col">
            <label>Rego:</label>
            <input className="input"
                type="date"
                name="rego"
                value={formData.rego}
                onChange={handleChange}
                required
            />
        </div>
        <div className="flex flex-col">
            <label>Cof:</label>
            <input className="input"
                type="date"
                name="cof"
                value={formData.cof}
                onChange={handleChange}
                required
            />
        </div>
        <div className="flex flex-col">
            <label>Location:</label>
            <input className="input"
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
            />
        </div>
        <button className="mt-4 bg-green-600 p-2 rounded" type="submit">Update</button>
    </form>
}

function getDaysDifference(date) {
    const date1 = new Date();
    const date2 = new Date(date)
    date1.setHours(0, 0, 0, 0);
    // Convert both dates to milliseconds
    const timeDiff = date2.getTime() - date1.getTime();

    // Convert milliseconds to days (1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
    const dayDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    return dayDiff;
}
function needsAlert(vehicle, alertSetting) {
    let needsAlert = false
    let alertLevel = 0
    let alertInfo = []
    //odometer: 0, hubo: 0, ruc: 0, rego: '2000-01-01', cof: '2000-01-01', service: 0, location: '', ...vehicle
    if ('odometer' in vehicle) {
        if ('service' in vehicle) {
            let serviceLeft = vehicle.service - vehicle.odometer
            if (serviceLeft <= 100) {
                needsAlert = true
                alertLevel = 2
                alertInfo.push('Service: < 100kms')
            } else if (serviceLeft <= alertSetting.service) {
                needsAlert = true
                alertLevel = alertLevel == 2 ? 2 : 1
                alertInfo.push(`Service: < ${alertSetting.service}kms`)
            }
        } else {
            alertInfo.push('service is not recorded')
            needsAlert = true
            alertLevel = 2
        }
    } else {
        alertInfo.push('odometer is not recorded')
        needsAlert = true
        alertLevel = 2
    }
    if ('hubo' in vehicle) {
        if ('ruc' in vehicle) {
            let rucLeft = vehicle.ruc - vehicle.hubo
            if (rucLeft <= 100) {
                needsAlert = true
                alertLevel = 2
                alertInfo.push('RUC: < 100kms')
            } else if (rucLeft <= alertSetting.ruc) {
                needsAlert = true
                alertLevel = alertLevel == 2 ? 2 : 1
                alertInfo.push(`RUC: < ${alertSetting.service}kms`)
            }
        } else {
            alertInfo.push('ruc is not recorded')
            needsAlert = true
            alertLevel = 2
        }
    } else {
        alertInfo.push('hubo is not recorded')
        needsAlert = true
        alertLevel = 2
    }
    if ('cof' in vehicle) {
        let cofLeft = getDaysDifference(vehicle.cof)
        if (cofLeft <= 10) {
            needsAlert = true
            alertLevel = 2
            alertInfo.push('COF: < 10days')
        } else if (cofLeft <= alertSetting.cof) {
            needsAlert = true
            alertLevel = alertLevel == 2 ? 2 : 1
            alertInfo.push(`COF: < ${alertSetting.cof}days`)
        }
    } else {
        alertInfo.push('COF is not recorded')
        needsAlert = true
        alertLevel = 2
    }
    if ('rego' in vehicle) {
        let regoLeft = getDaysDifference(vehicle.rego)
        if (regoLeft <= 10) {
            needsAlert = true
            alertLevel = 2
            alertInfo.push('Rego: < 10days')
        } else if (regoLeft <= alertSetting.rego) {
            needsAlert = true
            alertLevel = alertLevel == 2 ? 2 : 1
            alertInfo.push(`Rego: < ${alertSetting.rego}days`)
        }
    } else {
        alertInfo.push('Rego is not recorded')
        needsAlert = true
        alertLevel = 2
    }
    let borderColor = needsAlert ? (alertLevel == 1 ? 'orange-border' : 'red-border') : ''
    return [needsAlert, alertLevel, alertInfo, borderColor]
}
function ListVehicle({ vehicles, setVehicleIsEditing, setIsEditting }) {
    const [alertSetting, setAlertSetting] = useState({ rego: 30, ruc: 1000, cof: 30, service: 1000 })
    function handleEdit(vehicle) {
        setIsEditting(true)
        setVehicleIsEditing(vehicle)
    }
    useEffect(() => {
        (async () => {
            let company = (await axios.put('/company')).data
            if ('alertSetting' in company) {
                setAlertSetting(company.alertSetting)
            }
        })()
    }, [])
    return <div className="px-2">
        {vehicles.length === 0 ? (
            <p>No vehicles added yet.</p>
        ) : (
            <ul>
                {vehicles.map((vehicle) => (
                    <li key={vehicle.name} className={`${needsAlert(vehicle, alertSetting)[3]} block my-2 p-2 relative`}>
                        <div className="font-bold text-lg">{vehicle.name}</div>
                        <button className="absolute text-white top-0 right-0 p-2 m-2 bg-green-600 rounded" onClick={() => {
                            setIsEditting(true);
                            setVehicleIsEditing(vehicle)
                        }}>Edit</button><div>{needsAlert(vehicle, alertSetting)[2].map((a, i) => <div key={i}>{a}</div>)}</div>
                    </li>
                ))}
            </ul>
        )}</div>
}
function Vehicles() {
    const [isEditting, setIsEditting] = useState(false)
    const [vehicleIsEditing, setVehicleIsEditing] = useState({})
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
    if (isEditting) return <EditVehicle vehicle={vehicleIsEditing} setIsEditting={setIsEditting} setVehicles={setVehicles} vehicles={vehicles} />
    return (
        <div>
            <AddVehicle vehicles={vehicles} setVehicles={setVehicles} />
            <ListVehicle {...{ vehicles, setVehicleIsEditing, setIsEditting }} />
        </div>
    )
}
function AlertSetting() {
    const [formData, setFormData] = useState({ rego: 30, ruc: 1000, cof: 30, service: 1000 });
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)
    const [successful, setSuccessful] = useState(false)
    useEffect(() => {
        (async () => {
            let company = (await axios.put('/company')).data
            if ('error' in company) {
                setError('company code not definded')
            }
            if ('alertSetting' in company) {
                setFormData({ ...formData, ...company.alertSetting })
            }
        })()
        setIsLoading(false)
    }, [successful])
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

        axios.put('/company', { alertSetting: formData }).then((res) => {
            setFormData(res.data.alertSetting)
            setSuccessful(true)
            setTimeout(() => setSuccessful(false), 2000)
        }).catch((err) => {
            setError(err.message)
        })
    };
    if (isLoading) return <div>Loading</div>
    if (error) return <div>Something goes wrong</div>
    return <form className="relative m-2 p-3 bg-blue-400 text-white" onSubmit={handleSubmit}>
        {successful && <div>saved successfully</div>}
        <div className="flex flex-col">
            <label>Rego (days to alert):</label>
            <input className="input"
                type="number"
                name="rego"
                value={formData.rego}
                onChange={handleChange}
                required
            />
        </div>
        <div className="flex flex-col">
            <label>ruc (kms to alert):</label>
            <input className="input"
                type="number"
                name="ruc"
                value={formData.ruc}
                onChange={handleChange}
                required
            />
        </div>
        <div className="flex flex-col">
            <label>Cof (days to alert):</label>
            <input className="input"
                type="number"
                name="cof"
                value={formData.cof}
                onChange={handleChange}
                required
            />
        </div>
        <div className="flex flex-col">
            <label>Service (kms to alert):</label>
            <input className="input"
                type="number"
                name="service"
                value={formData.service}
                onChange={handleChange}
                required
            />
        </div>
        <button className="mt-4 bg-green-600 p-2 rounded" type="submit">Save</button>
    </form>
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
            <div className="grid grid-cols-3 mt-1">
                <h4 className={`p-3 text-center ${activePage == 'users' ? " bg-white text-black border-t-4 border-blue-400" : "bg-blue-400 text-white"}`} onClick={() => setActivePage('users')}>Users</h4>
                <h4 className={`p-3 text-center ${activePage == 'vehicles' ? " bg-white text-black border-t-4 border-blue-400" : "bg-blue-400 text-white"}`} onClick={() => setActivePage('vehicles')}>Vehicles</h4>
                <h4 className={`p-3 text-center ${activePage == 'alertSetting' ? " bg-white text-black border-t-4 border-blue-400" : "bg-blue-400 text-white"}`} onClick={() => setActivePage('alertSetting')}>Alert Setting</h4>
            </div>
            {activePage == 'users' && <ul>
                {users.map(item => (
                    <li className=" flex justify-between align-center bg-slate-200 m-2 p-2" key={item.sub}><div className=" flex items-center">{item.name} {item.email}</div><button className={`inline-block mr-0 w-max h-max rounded p-2 text-white ${item.company.status == 0 ? "bg-green-600" : "bg-red-600"}`} onClick={toggleApprove(item)}>{item.company.status == 0 ? 'approve' : 'remove'}</button></li> // Adjust according to your data structure
                ))}
            </ul>}
            {activePage == 'vehicles' && (
                <Vehicles />
            )}
            {activePage == 'alertSetting' && <AlertSetting />}
        </div>
    );
}
function VehicleCapsule({ vehicle, vehicles, setVehicles }) {
    const [isEditting, setIsEditting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    // [needsAlert, alertLevel, alertInfo, borderColor]
    const [alertInfo, setAlertInfo] = useState([false, 0, [], ''])

    useEffect(() => {
        (async () => {
            let company = (await axios.put('/company')).data
            let alertSetting = 'alertSetting' in company ? company.alertSetting : { rego: 30, ruc: 1000, cof: 30, service: 1000 }
            setAlertInfo(needsAlert(vehicle, alertSetting))
        })()
        setIsLoading(false)
    }, [])
    if (isLoading) return <div>Loading...</div>
    return <div className={`${alertInfo[3]} p-2 relative`}>
        <div className="font-bold text-lg">{vehicle.name}</div>
        <button className="absolute text-white top-0 right-0 p-2 m-2 bg-green-600 rounded" onClick={() => { setIsEditting(true) }}>update</button>
        {alertInfo[0] && <div>{alertInfo[2].map((a, i) => <div key={i}>{a}</div>)}</div>}
        {isEditting && <EditVehicle {...{ vehicle, vehicles, setVehicles, setIsEditting }} />}
    </div>
}
function DriverPage({ user }) {
    const [inputText, setInputText] = useState('')
    useEffect(() => {
        console.log(inputText)
    }, [inputText])
    const [vehicles, setVehicles] = useState([])
    const [vehicleIds, setVehicleIds] = useState([])
    const handleChange = (e) => {
        setInputText(e.target.value.toUpperCase())
        setShowCapsule(vehicleIds.includes(e.target.value.toUpperCase()))
    }
    const [showCapsule, setShowCapsule] = useState(false)
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
                    setVehicleIds(response.data.map(v => v.name))
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
    return <div className={`flex flex-col min-h-screen`}>
        <div className="bg-blue-200 rounded text-center py-4">Hi {user.name},</div>
        <div className={`${!showCapsule && 'flex-1'} flex flex-col justify-center `}>
            <div className="m-2 p-3 bg-blue-400 text-white">
                <div className="text-center">Enter vehicle number</div>
                <div className="text-center"><input className="input" type='text' onChange={handleChange} value={inputText} /></div>
            </div>
        </div>
        {showCapsule && <VehicleCapsule vehicle={vehicles.find(v => v.name == inputText)} {...{ vehicles, setVehicles }} />}
    </div>

}
function App({ data }) {
    let { user, companies } = data
    // let [isBoss, setIsBoss] = useState(user.isBoss)
    let [showManagePage, setPage] = useState(user.isBoss)

    return (
        <div>
            {user.isBoss && <div className="fixed flex bottom-0 w-full">
                <button className={`w-1/2 px-3 py-1.5 text-sm font-semibold leading-6 ${!showManagePage ? 'text-black bg-white' : 'bg-indigo-600 text-white'} shadow-sm `} onClick={() => setPage(false)}>Login as Driver</button>
                <button className={`w-1/2 px-3 py-1.5 text-sm font-semibold leading-6 ${showManagePage ? 'text-black bg-white' : 'bg-indigo-600 text-white'} shadow-sm `} onClick={() => setPage(true)}>Manage fleet</button>
            </div>}
            {showManagePage ?
                <BossPage />
                :
                (('company' in user && 'status' in user.company && user.company.status == 1) ?
                    <DriverPage {...{ user }} />
                    :
                    <InstructionPage user={user} companies={companies} />)
            }
        </div>
    )
}
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}
function decodeJwtResponse(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
}

function LoginPage({ setNeedsReload }) {
    const handleCredentialResponse = (response) => {
        setCookie('token', response.credential, 365)
        setNeedsReload(true)
    };

    useEffect(() => {
        google.accounts.id.initialize({
            client_id: '859003465245-0e19el21rsofb768u8icerklp5o8np6r.apps.googleusercontent.com',
            callback: handleCredentialResponse
        });
        const parent = document.getElementById('google_btn');
        google.accounts.id.renderButton(parent, { theme: "filled_blue" });
        google.accounts.id.prompt();
    }, [])
    return <div id="login-with-google" className="flex items-center justify-center min-h-screen">
        <div id="google_btn"></div>
    </div>
}
function LoginOrApp() {
    const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false)
    const [needsReload, setNeedsReload] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [data, setData] = useState({})
    useEffect(() => {
        (async () => {
            setIsLoading(true)
            const res = await axios.post('/user')
            if ('user' in res.data && 'error' in res.data.user) {
                // google not logged in as default
            } else {
                !isGoogleLoggedIn && setIsGoogleLoggedIn(true)
                setData(res.data)
            }
            setIsLoading(false)
        })()
    }, [needsReload])
    if (isLoading) return <div>loading...</div>
    return isGoogleLoggedIn ? <App data={data} /> : <LoginPage {...{ setNeedsReload }} />
}
(function renderRoot() {

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<LoginOrApp />);
})()