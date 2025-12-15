import { HttpException } from "@nestjs/common";
import { GROUP_NAME_HAS_BEEN_TAKEN } from "../constants";

export class GroupNameExistedException extends HttpException {
	constructor() {
		super(GROUP_NAME_HAS_BEEN_TAKEN, 422)
	}
}