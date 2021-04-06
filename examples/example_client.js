import FIXParser, {
    Field,
    Fields,
    Messages,
    Side,
    OrderTypes,
    HandlInst,
    TimeInForce,
    EncryptMethod,
} from '../src/FIXParser'; // from 'fixparser';

const fixParser = new FIXParser();
const SENDER = 'AUSYDUTRC1';
const TARGET = 'AACAPAUETFC';

function sendLogon() {

    fixParser.setNextTargetMsgSeqNum(23);
    console.log(fixParser.getNextTargetMsgSeqNum());
    const logon = fixParser.createMessage(
        new Field(Fields.BeginString, 'FIXT.1.1'),
        new Field(Fields.MsgType, Messages.Logon),
        new Field(Fields.MsgSeqNum, fixParser.getNextTargetMsgSeqNum()),
        new Field(Fields.SenderCompID, SENDER),
        new Field(Fields.SendingTime, fixParser.getTimestamp()),
        new Field(Fields.TargetCompID, TARGET),
        new Field(Fields.EncryptMethod, EncryptMethod.None),
        new Field(Fields.HeartBtInt, 30),
        new Field(Fields.DefaultApplVerID, 9),
    );
    const messages = fixParser.parse(logon.encode());
    console.log('sending message', messages[0].description, messages[0].string);
    fixParser.send(logon);
    
}

fixParser.connect({
    host: 'localhost',
    port: 9878,
    protocol: 'tcp',
    sender: SENDER,
    target: TARGET,
    fixVersion: 'FIXT.1.1',
    ResetOnLogon: 'Y'
});

fixParser.on('open', async () => {
    console.log('Open');
    const test = fixParser.createMessage(
        new Field(Fields.BeginString, 'FIXT.1.1'),
        new Field(Fields.MsgType, Messages.TestRequest),
        new Field(Fields.SenderCompID, SENDER),
        new Field(Fields.SendingTime, fixParser.getTimestamp()),
        new Field(Fields.TargetCompID, TARGET),
        new Field(Fields.TestReqID, 'reqId'),
    );
    sendLogon();
    const orderMessage = fixParser.createMessage(
        new Field(Fields.MsgType, Messages.NewOrderSingle),
        new Field(Fields.MsgSeqNum, fixParser.getNextTargetMsgSeqNum()),
        new Field(Fields.SenderCompID, SENDER),
        new Field(Fields.SendingTime, fixParser.getTimestamp()),
        new Field(Fields.TargetCompID, TARGET),
        new Field(Fields.ClOrdID, 2),
        new Field(
          Fields.HandlInst,
          HandlInst.AutomatedExecutionNoIntervention,
        ),
        new Field(Fields.OrderQty, 2),
        new Field(Fields.TransactTime, fixParser.getTimestamp()),
        new Field(Fields.OrdType, OrderTypes.Market),
        new Field(Fields.Side, Side.Buy),
        new Field(Fields.Symbol, '700.HK'),
        new Field(Fields.TimeInForce, TimeInForce.Day),
      );
      fixParser.send(orderMessage);

});
fixParser.on('message', (message) => {
    console.log('received message', message);
});
fixParser.on('close', () => {
    console.log('Disconnected');
});
fixParser.on('error', (error) => {
    console.log(error);
});
