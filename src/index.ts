import axios from "axios";
import FormData from "form-data";
import BN from "bn.js";

export function sayHello() {
    console.log('hi')
}
export function sayGoodbye() {
    console.log('goodbye')
}


export interface Task {
   user_address: string;
   md5: string;
   task_type: string;
   status: string;
   proof: Uint8Array;
   aux: Uint8Array;
   instances: Uint8Array;
   public_inputs: Array<string>;
   private_inputs: Array<string>;
   _id: any;
   submit_time: string;
   process_started?: string;
   process_finished?: string;
}

export interface ProvingTask {
   user_address: string;
   md5: string;
   public_inputs: Array<string>;
   private_inputs: Array<string>;
}

export interface DeployTask {
   user_address: string;
   md5: string;
   chain_id: number;
}

export interface VerifyData {
   proof: Array<BN>;
   target_instances: Array<BN>;
   aggregator_instances: Array<BN>;
   aux_instances: Array<BN>; 
}

export interface Statistics {
    totalImages: number;
    totalProofs: number;
    totalTasks: number;
    totalDeployed: number;
}

export interface StatusState {
    tasks: Array<Task>,
    statistics: Statistics,
    loaded: boolean;
}

export interface QueryParams {
    user_address: string;
    md5: string;
    id: string;
    tasktype: string;
    taskstatus: string;
}

export interface DeploymentInfo {
    chain_id: number,
    address: string,
}

export interface Image {
    user_address: string,
    md5: string,
    deployment: Array<DeploymentInfo>
}

export class ZkWasmServiceHelper {
    constructor(
        public endpoint: string,
        public username: string,
        public useraddress: string
    ) { }
    async prepareRequest(
        method: "GET" | "POST",
        url: string,
        body: JSON | FormData | null,
        headers?: {
            [key: string]: string;
        }
    ) {
        if (method === "GET") {
            console.log(this.endpoint + url);
            try {
                let response = await axios.get(
                    this.endpoint + url,
                    body ? { params: body! } : {}
                );
                return response.data;
            } catch (e: any) {
                console.error(e);
                throw Error("RestEndpointGetFailure");
            }
        } else {
            try {
                let response = await axios.post(
                    this.endpoint + url,
                    body ? body! : {},
                    {
                        headers: {
                            ...headers,
                        },
                    }
                );
                return response.data;
            } catch (e: any) {
                console.log(e);
                throw Error("RestEndpointPostFailure");
            }
        }
    }

    async getJSONResponse(json: any) {
        if (json["success"] !== true) {
            console.error(json);
            throw new Error("RequestError:" + json["error"]);
        }
        return json["result"];
    }

    async invokeRequest(
        method: "GET" | "POST",
        url: string,
        body: JSON | FormData | null,
        headers?: {
            [key: string]: string;
        }
    ) {
        let response = await this.prepareRequest(method, url, body, headers);
        return await this.getJSONResponse(response);
    }
}

export class ZkWasmServiceTaskHelper extends ZkWasmServiceHelper {
    constructor(endpoint: string, username: string, useraddress: string) {
        super(endpoint, useraddress, useraddress);
    }

    async loadStatistics(): Promise<Statistics> {
        let headers = { "Content-Type": "application/json" };
        let queryJson = JSON.parse("{}");

        let st = await this.invokeRequest("GET", `/statistics`, queryJson);
        console.log("loading task board!");

        return {
            totalImages: st.total_images,
            totalProofs: st.total_proofs,
            totalTasks: st.total_tasks,
            totalDeployed: st.total_deployed,
        }
    }



    async loadTasks(query: QueryParams) {
        let headers = { "Content-Type": "application/json" };
        let queryJson = JSON.parse("{}");

        //build query JSON
        let objKeys = Object.keys(query) as Array<keyof QueryParams>;
        objKeys.forEach((key) => {
          if (query[key] != "") queryJson[key] = query[key];
        });

        console.log("params:", query);
        console.log("json", queryJson);

        let tasks = await this.invokeRequest("GET", `/tasks`, queryJson);
        console.log("loading task board!");
        return tasks;
    }


    async addNewWasmImage(formdata: FormData) {
        console.log("wait response", formdata);
        let headers = { 'Content-Type': 'multipart/form-data' };
        console.log("wait response", headers);

        const response = await this.invokeRequest(
            "POST",
            "/setup",
            formdata,
            headers
        );
        console.log("get addNewWasmImage response:", response.toString());
        return response;
    }

    async addProvingTask(task: ProvingTask) {
        const response = await this.invokeRequest(
            "POST",
            "/prove",
            JSON.parse(JSON.stringify(task))
        );
        console.log("get addProvingTask response:", response.toString());
        return response;
    }

    async addDeployTask(
        task: DeployTask
    ) {

        const response = await this.invokeRequest(
            "POST",
            "/deploy",
            JSON.parse(JSON.stringify(task))
        );
        console.log("get addDeployTask response:", response.toString());
        return response;

    }

}

export class ZkWasmServiceImageHelper extends ZkWasmServiceHelper {
    constructor(endpoint: string, username: string, useraddress: string) {
        super(endpoint, useraddress, useraddress);
    }

    async queryImage(md5: string) {
        let req = JSON.parse("{}");
        req["md5"] = md5;

        const images = await this.invokeRequest(
            "GET",
            "/image",
            req
        );
        console.log("get queryImage response.");
        return images[0]!;
    }

    async queryImages(md5: string) {
        let req = JSON.parse("{}");
        req["md5"] = md5;

        const images = await this.invokeRequest(
            "GET",
            "/image",
            req
        );
        console.log("get queryImage response.");
        return images;
    }

}
