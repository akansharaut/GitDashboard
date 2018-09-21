import React, {Component} from 'react';
import './App.scss';

class App extends Component {
    accessToken = '2d281ee508322b815589da52f146b1b0758aa806';

    constructor(props) {
        super(props);
        this.state = {
            members: [],
            teams: [],
            prList: {},
            memberPrList: {},
            prLinks: [],
            prLinksVisible: false
        };
        this.filterBasedOnTeam = this.filterBasedOnTeam.bind(this);
    }

    componentWillMount() {
        fetch('https://github.deere.com/api/v3/orgs/MyJohnDeere/teams?access_token=' + this.accessToken)
            .then(response => {
                return response.json();
            }).then(teams => {
            this.setState({teams});
        });
    }

    fetchMemberData(members) {
        let prList = {};

        if(!members[0].fetch) {
            members.forEach(member => {
                fetch('https://github.deere.com/api/v3/search/issues?q=state%3Aopen+author%3A' + member.login + '+type%3Apr&access_token=' + this.accessToken)
                    .then(response => {
                        return response.json();
                    }).then(pr => {
                    if (pr.total_count > 0) {
                        pr.items.forEach((item) => {
                            let repoName = item.repository_url.split("/").splice(-1)[0];
                            let newList = [];
                            if (prList[repoName]) {
                                newList = prList[repoName];
                            }
                            newList.push({
                                repoUrl: item.repository_url,
                                pullRequestUrl: item.html_url,
                                title: item.title,
                                id: item.id,
                                createdDate: item.created_at,
                                createdby: item.user.login
                            });
                            prList[repoName] = newList;
                        });
                    }
                    const prLinks = Object.keys(prList).map(() => true);
                    this.setState({
                        prList,
                        memberPrList: prList,
                        prLinks
                    });
                });
            });
        } else {
            let user, temp = {};
            user = Object.keys(this.state.memberPrList).map(key => this.state.memberPrList[key].filter(data => members[0].login === data.createdby));

            Object.keys(this.state.memberPrList).forEach((key, i) => user[i].length ? temp = Object.assign({[key]: user[i]}, temp) : '' );


            this.setState({
                prList: temp
            });
        }
    }

    filterBasedOnTeam(event) {
        fetch('https://github.deere.com/api/v3/teams/' + event.target.value + '/members?access_token=' + this.accessToken)
            .then(response => {
                return response.json();
            }).then(members => {
            this.setState({members});
            this.fetchMemberData(members);
        });
    }

    showPRLinks = (iterator)  => {
        let linkVisibilityChange = this.state.prLinks;
        linkVisibilityChange[iterator] = !linkVisibilityChange[iterator];

        this.setState({prLinks: linkVisibilityChange});
    };

    fullDateTime = (dateValue) => {
        let d = new Date(dateValue);
        return d.toLocaleString([], { hour12: true});
    };

    filterBasedOnMember = (event) => {
        this.fetchMemberData([{
            login: event.target.value,
            fetch: false
        }])
    };

    render() {
        return (
            <div className="App">
                <header className="App-header">
                    <div className='color-bars'>
                        <div className='primary'/>
                        <div className='secondary'/>
                    </div>
                    <div className='header-bar'>
                        <h1>Git DashBoard</h1>
                        <div className='logo' title='Deere-Logo'/>
                    </div>
                </header>
                <aside>
                    <div className='org'>
                        <h2>Organization</h2>
                        <select>
                            <option value='myjohndeere'>MyJohnDeere</option>
                        </select>
                    </div>
                    <div className='teams'>
                        <h2>Teams</h2>
                        <select onChange={this.filterBasedOnTeam}>
                            <option>select team</option>
                            {this.state.teams && this.state.teams.map((team, i) => {
                                return (
                                    <option value={team.id} id={team.id} key={i}>{team.name}</option>
                                );
                            })}
                        </select>
                    </div>
                    <div className='members'>
                        <h2>Members</h2>
                        <select onChange={this.filterBasedOnMember}>
                            <option>select team member</option>
                            {this.state.members && this.state.members.map((member, i) => {
                                return (
                                    <option value={member.login} id={member.id} key={i}>{member.login}</option>
                                );
                            })}
                        </select>
                    </div>
                </aside>
                <section>
                    {Object.keys(this.state.prList).map((key, iterator) => {
                        return (
                            <div key={iterator}>
                                <h2 onClick={()=> this.showPRLinks(iterator)}>
                                    {key} ({this.state.prList[key].length})
                                </h2>
                                {this.state.prLinks[iterator] && (
                                    <div className='pr-links'>
                                        {this.state.prList[key].map((pr, i) => {
                                            // console.log(pr);
                                            return (
                                                <a className='links'
                                                   href={pr.pullRequestUrl}
                                                   target='_blank' key={i}>
                                                    <span className='pr-link'>
                                                        {pr.title}
                                                    </span>
                                                    <div className='pr-author'>
                                                        created by <span>{pr.createdby}</span> on <span>{this.fullDateTime(pr.createdDate)}</span>
                                                    </div>
                                                </a>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </section>
            </div>
        );
    }
}

export default App;
