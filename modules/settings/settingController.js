const settingHelper = require('./settingHelper');

const settingController = {};

settingController.addSnapshotEmailCtr = async (req, res, next)=>{
    try{
        if ((!req.body.snapshotEmail) || (!req.body.snapshotEmail.length))
            return res.status(400).json({status:false, message: "Please enter snapshot emails."})

        const { snapshotEmail } = req.body;
        console.log({data : snapshotEmail});
        const newEmailList = await settingHelper.addSnapshotEmail(snapshotEmail);

        return res.status(200).json({status: true, data: {newEmailList}});
    }catch(e){
        console.log(e);
        return res.status(500).json({status: false, message: 'something went wrong' });
    }
}

settingController.addccEmailCtr = async (req, res, next)=>{
    try{
        if ((!req.body.ccEmail) || (!req.body.ccEmail.length))
            return res.status(400).json({status:false, message: "Please enter CC emails."})

        const { ccEmail } = req.body;
        console.log({data : ccEmail});
        const newEmailList = await settingHelper.addccEmail(ccEmail);

        return res.status(200).json({status: true, data: {newEmailList}});
    }catch(e){
        console.log(e);
        return res.status(500).json({status: false, message: 'something went wrong' });
    }
}

module.exports = settingController;
