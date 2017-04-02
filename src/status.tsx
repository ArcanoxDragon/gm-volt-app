import * as React from "react";
import * as volt from "gm-volt";

import { AsyncComponent } from "./asyncComponent";
import {
    AsyncStorage,
    Button,
    StyleSheet,
    Text,
    View,
    ViewStyle
    } from "react-native";

import Icon from "react-native-vector-icons/MaterialIcons";
import CommunityIcon from "react-native-vector-icons/MaterialCommunityIcons";

export interface Props {}

export interface State {
    chargeStatus: volt.ChargeStatus;
    error: string;
    loading: boolean;
}

export class StatusView extends AsyncComponent<Props, State> {
    static contextTypes = {
        app: React.PropTypes.object
    }

    constructor() {
        super();

        this.state = {
            chargeStatus: null,
            error: null,
            loading: true
        };
    }

    componentWillMount(): void {
        this.loadData();
    }

    private async loadData() {
        try {
            let chargeStatus = await volt.getChargeStatus();
            await this.setStateAsync( { chargeStatus, loading: false } );
        } catch ( error ) {
            await this.setStateAsync( { error: error.message } );
        }
    }

    private async refreshData() {
        await this.setStateAsync( {
            chargeStatus: null,
            error: null,
            loading: true
        } );
        await this.loadData();
    }

    private async logOut() {
        await AsyncStorage.removeItem( "@volt:loggedin" );
        this.context.app.changeView( "login" );
    }

    render() {
        let {
            chargeStatus,
            error,
            loading
        } = this.state;
        let curViewState = "loading";
        let curView: Object;

        if ( error ) curViewState = "error";
        else if ( !loading ) curViewState = "main";

        switch ( curViewState ) {
            case "loading":
                curView = <View style={styles.stats}>
                              <Text style={styles.label}>Loading charge status...</Text>
                              <Text style={[styles.label, styles.muted]}>(this may take a while)</Text>
                          </View>;
                break;
            case "main":
                curView = <View style={styles.stats}>
                              <Text style={styles.label}>Battery state of charge: {chargeStatus.chargePercent}%</Text>
                              <View style={styles.socWrapper}>
                                  <View style={[styles.socBar, { width: `${ chargeStatus.chargePercent }%` }]}/>
                              </View>
                              <View style={styles.row}>
                                  <Text style={styles.label}>Plugged in:</Text>
                                  { chargeStatus.pluggedIn
                                        ? <Icon name={"check-circle"}
                                                style={[styles.icon, styles.green]}/>
                                        : <CommunityIcon name={"close-circle-outline"}
                                                         style={[styles.icon, styles.red]}/>}
                                  {chargeStatus.pluggedIn
                                       ? <Text style={[styles.label, styles.muted]}>
                                             (est. done by: {chargeStatus.estDoneBy})
                                         </Text>
                                       : null}
                              </View>
                              <View style={styles.row}>
                                  <Text style={styles.label}>Estimated EV range:</Text>
                                  <Text style={styles.label}>{chargeStatus.evRange} {chargeStatus.evUnit}</Text>
                              </View>
                              <View style={styles.row}>
                                  <Text style={styles.label}>Estimated total range:</Text>
                                  <Text style={styles.label}>{chargeStatus.totalRange} {chargeStatus.totalUnit}</Text>
                              </View>
                              <Button onPress={() => { this.refreshData(); }}
                                      title={"Refresh"}/>
                          </View>;
                break;
            default:
                curView = <View style={styles.stats}>
                              <Text style={styles.error}>
                                  An error occurred: {error.toString()}
                              </Text>
                          </View>;
                break;
        }

        return ( <View style={styles.view}>
                     <Text style={styles.title}>Volt Status</Text>
                     {curView}
                     <Button onPress={() => { this.logOut(); }}
                             title={"Log Out"}/>
                 </View> );
    }
}

type StyleSheet = { [ key: string ]: ViewStyle }
const textColor = "#FCFCFC";
const styles = StyleSheet.create( {
    view: {
        flex: 1,
        justifyContent: "center",
        alignItems: "stretch",
        backgroundColor: "#203035"
    },
    error: {
        color: "#ff4444"
    },
    green: {
        color: "#6FDC6F"
    },
    icon: {
        fontFamily: "Material Icons",
        color: textColor,
        fontSize: 28,
        lineHeight: 28,
        marginRight: 16
    },
    label: {
        color: textColor,
        fontSize: 20,
        marginRight: 16
    },
    muted: {
        fontStyle: "italic",
        fontSize: 15,
        color: "rgba( 255, 255, 255, 0.6 )"
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 16
    },
    red: {
        color: "#DC6F6F"
    },
    socBar: {
        height: "100%",
        backgroundColor: "#6FDC6F",
        borderRadius: 2.5
    },
    socWrapper: {
        alignItems: "stretch",
        borderColor: "rgba( 255, 255, 255, 0.5 )",
        borderRadius: 3,
        borderWidth: 1.5,
        flexDirection: "row",
        height: 50,
        justifyContent: "flex-start",
        marginTop: 8,
        width: "100%"
    },
    stats: {
        width: "90%",
        backgroundColor: "rgba( 255, 255, 255, 0.25 )",
        borderRadius: 3,
        padding: 8,
        marginVertical: 10,
        alignItems: "stretch"
    },
    title: {
        fontSize: 40,
        color: textColor
    }
} as StyleSheet );