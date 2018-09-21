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

    fetchMemberData(members) {
        let prList = {};

        if (!members[0].fetch) {
            console.log('adasd');
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
                        memberPrList: prList,
                        teamPrList: prList,
                        prLinks
                    });
                });
            });
        } else {
            let user, temp = {};
            user = Object.keys(this.state.teamPrList).map(key => this.state.teamPrList[key].filter(data => members[0].login === data.createdby));
            user.sort((a,b)=>a.length>b.length);

            Object.keys(this.state.teamPrList).forEach((key, i) => user[i].length ? temp = Object.assign({[key]: user[i]}, temp) : '');


            this.setState({
                memberPrList: temp
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
        let d = new Date(dateValue);
        let dd = new Date(Date.now());
        console.log("date",d.getDate());
        console.log("date now",dd.getDate());
        if(d.getDate() === dd.getDate()){
            return 'today';
        }else if(dd.getDate() - d.getDate() < 28){
            return dd.getDate() - d.getDate() + ' days ago';
        } else {
            return d.toLocaleString([], {hour12: true})
        }
        /*if(d.getDate() === dd.getDate()){
            return 'today';
        }else if(d.getDate() === dd.getDate()-1){
            return 'a day ago';
        }else if(d.getDate() === dd.getDate()-2){
            return 'two day ago';
        }else {
            return d.toLocaleString([], {hour12: true})
        }*/
        //return d.getDate() === dd.getDate()? 'today': d.toLocaleString([], {hour12: true});
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
