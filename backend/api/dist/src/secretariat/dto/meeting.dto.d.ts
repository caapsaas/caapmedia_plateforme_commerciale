import { PaginationQueryDto } from "../../common/pagination/dto/pagination-query.dto";
export declare class CreateMeetingDto {
    title: string;
    meetingDateTime: Date;
    meetingLocation?: string;
    agenda?: string;
    subsidiaryId?: string;
    participantIds?: string[];
}
export declare class UpdateMeetingDto {
    title?: string;
    meetingDateTime?: Date;
    meetingLocation?: string;
    agenda?: string;
    minutes?: string;
    participantIds?: string[];
}
export declare class SearchMeetingsDto extends PaginationQueryDto {
    title?: string;
    meetingDateTime?: Date;
}
