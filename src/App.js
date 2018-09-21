import React, {Component} from 'react';
import './App.scss';

class App extends Component {
    accessToken = '2d281ee508322b815589da52f146b1b0758aa806';

    constructor(props) {
        super(props);
        this.state = {
            members: [],
            teams: [],
            memberPrList: {},
            teamPrList: {},
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
    getKeyValueList = (user) => {
        let temp = {};
        user.forEach((prList) => {
            let repoName;
            if(prList.length) {
                repoName = prList[0].repoUrl.split("/").splice(-1)[0];
                temp = Object.assign({[repoName]: prList}, temp)
            }
        });

        return temp;
    };

    fetchMemberData(members) {
        let prList = {};

        if (!members[0].fetch) {
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
                                createdby: item.user.login,
                                createdDate: item.created_at,
                                id: item.id,
                                pullRequestUrl: item.html_url,
                                repoUrl: item.repository_url,
                                title: item.title
                            });
                            prList[repoName] = newList;
                        });
                    }

                    let prListArray = Object.keys(prList).map((list) => prList[list]);
                    prListArray.sort((a,b)=>a.length>b.length);

                    const prLinks = Object.keys(prList).map(() => true);

                    prList = this.getKeyValueList(prListArray);
                    this.setState({
                        memberPrList: prList,
                        teamPrList: prList,
                        prLinks
                    });
                });
            });
        } else if(members[0].login !== 'select team member') {
            let user, temp = {};
            user = Object.keys(this.state.teamPrList).map(key => this.state.teamPrList[key].filter(data => members[0].login === data.createdby));
            user.sort((a,b)=>a.length>b.length);

            temp = this.getKeyValueList(user);


            this.setState({
                memberPrList: temp
            });
        } else {
            this.setState({
                memberPrList: this.state.teamPrList
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

    showPRLinks = (iterator) => {
        let linkVisibilityChange = this.state.prLinks;
        linkVisibilityChange[iterator] = !linkVisibilityChange[iterator];

        this.setState({prLinks: linkVisibilityChange});
    };

    fullDateTime = (dateValue) => {
        let prCreatedDate = new Date(dateValue);
        let todayDate = new Date(Date.now());
        if(prCreatedDate.getDate() === todayDate.getDate()){
            return 'today';
        }else if(todayDate.getDate() - prCreatedDate.getDate() < 28){
            return todayDate.getDate() - prCreatedDate.getDate() + ' days ago';
        } else {
            return prCreatedDate.toLocaleString([], {hour12: true})
        }
    };

    filterBasedOnMember = (event) => {
        this.fetchMemberData([{
            login: event.target.value,
            fetch: true
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
                        <select disabled>
                            <option value='myjohndeere'>MyJohnDeere</option>
                        </select>
                    </div>
                    <div className='teams'>
                        <h2>Teams</h2>
                        <select onChange={this.filterBasedOnTeam}>
                            <option>select team</option>
                            {this.state.teams && this.state.teams
                                .sort((left, right) => left.name.localeCompare(right.name))
                                .map((team, i) => {
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
                            {this.state.members && this.state.members
                                .sort((left, right) => left.login.localeCompare(right.login))
                                .map((member, i) => {
                                    return (
                                        <option value={member.login} id={member.id} key={i}>{member.login}</option>
                                    );
                                })}
                        </select>
                    </div>
                </aside>
                <section>
                    {Object.keys(this.state.memberPrList)
                        .map((key, iterator) => {
                            return (
                                <div key={iterator}>
                                    <h2 onClick={() => this.showPRLinks(iterator)}>
                                        {key} ({this.state.memberPrList[key].length})
                                    </h2>
                                    {this.state.prLinks[iterator] && (
                                        <div className='pr-links'>
                                            {this.state.memberPrList[key].map((pr, i) => {
                                                return (
                                                    <a className='links'
                                                       href={pr.pullRequestUrl}
                                                       target='_blank' key={i}>
                                                    <span className='pr-link'>
                                                        {pr.title}
                                                    </span>
                                                        <div className='pr-author'>
                                                            opened {this.fullDateTime(pr.createdDate)} by <span>{pr.createdby}</span>
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
